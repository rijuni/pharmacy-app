from rest_framework import serializers
from .models import (Cart, CartItem, Order, OrderItem, Prescription, 
                     OrderCancellationRequest, Refund, OrderDelivery)
from products.serializers import ProductSerializer
from users.models import Address
from users.serializers import AddressSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity')

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ('id', 'user', 'items', 'total_price', 'created_at')
    
    def get_total_price(self, obj):
        total = sum(item.product.price * item.quantity for item in obj.items.all())
        return total

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'quantity', 'price')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address = AddressSerializer(read_only=True)
    address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(), source='address', write_only=True
    )
    address_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('user', 'total_price')
    
    def get_address_details(self, obj):
        if obj.address:
            return f"{obj.address.street}, {obj.address.city}, {obj.address.state} - {obj.address.zip_code}"
        return "Address removed"

class PrescriptionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ('user',)


# ============= ORDER CANCELLATION SERIALIZERS =============
class OrderCancellationSerializer(serializers.ModelSerializer):
    can_cancel = serializers.SerializerMethodField()

    class Meta:
        model = OrderCancellationRequest
        fields = [
            'id', 'order', 'user', 'reason', 'comments', 'status',
            'requested_at', 'processed_at', 'processed_by', 'admin_notes', 'can_cancel'
        ]
        read_only_fields = ['user', 'status', 'requested_at', 'processed_at', 'processed_by', 'admin_notes']

    def get_can_cancel(self, obj):
        return obj.can_cancel


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = [
            'id', 'order', 'cancellation_request', 'refund_amount', 'refund_method',
            'status', 'transaction_id', 'refund_notes', 'requested_at', 'completed_at'
        ]
        read_only_fields = ['transaction_id', 'refund_notes', 'completed_at']


# ============= ORDER DELIVERY SERIALIZERS =============
class OrderDeliverySerializer(serializers.ModelSerializer):
    delivery_slot_details = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = OrderDelivery
        fields = [
            'id', 'order', 'delivery_slot', 'delivery_slot_details', 'status',
            'estimated_delivery_date', 'actual_delivery_date', 'delivery_partner',
            'tracking_number', 'delivery_attempts', 'last_delivery_attempt',
            'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'delivery_slot_details', 'actual_delivery_date', 'is_overdue', 
            'created_at', 'updated_at'
        ]

    def get_delivery_slot_details(self, obj):
        if obj.delivery_slot:
            return {
                'id': obj.delivery_slot.id,
                'time_window': f"{obj.delivery_slot.start_time.strftime('%H:%M')} - {obj.delivery_slot.end_time.strftime('%H:%M')}"
            }
        return None

    def get_is_overdue(self, obj):
        return obj.is_overdue
