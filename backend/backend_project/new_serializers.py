"""
DRF Serializers for new product and order features
Includes: Discounts, Delivery, Cancellations, Variants, Favorites
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta

from products.models import (
    Product, ProductVariant, Category, Review, Coupon, CouponUsage,
    ProductStock, StockMovement, Favorite, DrugInteraction,
    DeliverySlot, Notification
)
from orders.models import (
    Order, OrderItem, Prescription, OrderCancellationRequest,
    Refund, OrderDelivery
)


# ============= COUPON/DISCOUNT SERIALIZERS =============

class CouponSerializer(serializers.ModelSerializer):
    """Serializer for displaying coupons"""
    discount_type_display = serializers.CharField(source='get_discount_type_display', read_only=True)
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_type_display',
            'discount_value', 'max_discount_amount', 'min_purchase_amount',
            'max_uses', 'max_uses_per_user', 'valid_from', 'valid_until',
            'is_active', 'is_valid', 'times_used'
        ]
        read_only_fields = ['is_valid', 'times_used']
    
    def get_is_valid(self, obj):
        return obj.is_valid


class ApplyCouponSerializer(serializers.Serializer):
    """Request serializer for applying coupon"""
    coupon_code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2)


class CouponResponseSerializer(serializers.Serializer):
    """Response serializer for coupon application"""
    coupon = CouponSerializer()
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    final_total = serializers.DecimalField(max_digits=10, decimal_places=2)


class AdminCouponSerializer(serializers.ModelSerializer):
    """Extended coupon serializer for admin"""
    class Meta:
        model = Coupon
        fields = '__all__'


# ============= PRODUCT VARIANT SERIALIZERS =============

class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for product variants"""
    total_price = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'variant_name', 'quantity', 'unit',
            'additional_price', 'stock', 'sku', 'total_price', 'is_available'
        ]
    
    def get_total_price(self, obj):
        return str(obj.total_price)
    
    def get_is_available(self, obj):
        return obj.is_available


# ============= PRODUCT SERIALIZERS WITH NEW FIELDS =============

class ProductDetailedSerializer(serializers.ModelSerializer):
    """Detailed product serializer with all information"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'generic_name', 'category', 'category_name',
            'price', 'stock', 'image', 'requires_prescription',
            'availability_status', 'manufacturer', 'strength', 'form',
            'batch_number', 'expiry_date', 'salt_composition',
            'side_effects', 'expert_tips', 'how_to_use',
            'variants', 'average_rating', 'reviews_count',
            'is_available', 'is_expired', 'is_favorite', 'created_at'
        ]
    
    def get_average_rating(self, obj):
        return obj.average_rating
    
    def get_reviews_count(self, obj):
        return obj.reviews.count()
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(
                user=request.user,
                product=obj
            ).exists()
        return False
    
    def get_is_expired(self, obj):
        return obj.is_expired


# ============= FAVORITE/WISHLIST SERIALIZERS =============

class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer for favorites/wishlist"""
    product_detail = ProductDetailedSerializer(source='product', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'product', 'product_detail', 'added_at']
        read_only_fields = ['added_at']


# ============= REVIEW SERIALIZERS =============

class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for product reviews"""
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'product', 'rating', 'comment', 'user_name', 'created_at']
        read_only_fields = ['created_at']


class CreateReviewSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews"""
    class Meta:
        model = Review
        fields = ['product', 'rating', 'comment']


# ============= DRUG INTERACTION SERIALIZERS =============

class DrugInteractionSerializer(serializers.ModelSerializer):
    """Serializer for drug interactions"""
    drug1_name = serializers.CharField(source='drug1.name', read_only=True)
    drug2_name = serializers.CharField(source='drug2.name', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = DrugInteraction
        fields = [
            'id', 'drug1', 'drug1_name', 'drug2', 'drug2_name',
            'description', 'severity', 'severity_display', 'recommendation'
        ]


# ============= STOCK MANAGEMENT SERIALIZERS =============

class ProductStockSerializer(serializers.ModelSerializer):
    """Serializer for product stock information"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductStock
        fields = [
            'id', 'product', 'product_name', 'total_stock',
            'reserved_stock', 'available_stock', 'low_stock_threshold',
            'is_low_stock', 'last_restocked'
        ]
    
    def get_is_low_stock(self, obj):
        return obj.is_low_stock


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for stock movement logs"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type',
            'movement_type_display', 'quantity', 'notes', 'moved_at'
        ]
        read_only_fields = ['moved_at']


# ============= DELIVERY SLOT SERIALIZERS =============

class DeliverySlotSerializer(serializers.ModelSerializer):
    """Serializer for delivery slots"""
    available_capacity = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    can_book = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliverySlot
        fields = [
            'id', 'start_time', 'end_time', 'capacity',
            'current_bookings', 'available_capacity', 'is_full',
            'can_book', 'is_active'
        ]
    
    def get_available_capacity(self, obj):
        return obj.available_capacity
    
    def get_is_full(self, obj):
        return obj.is_full
    
    def get_can_book(self, obj):
        return obj.can_book()


# ============= ORDER SERIALIZERS WITH NEW FIELDS =============

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    product_detail = ProductDetailedSerializer(source='product', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_detail', 'quantity', 'price']


class OrderDetailedSerializer(serializers.ModelSerializer):
    """Detailed order serializer"""
    items = OrderItemSerializer(many=True, read_only=True)
    coupon_detail = CouponSerializer(source='coupon', read_only=True)
    delivery_slot_detail = DeliverySlotSerializer(source='delivery_slot', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'address', 'items', 'subtotal', 'discount_amount',
            'coupon', 'coupon_detail', 'tax_amount', 'shipping_charge',
            'total_price', 'status', 'status_display', 'payment_method',
            'payment_method_display', 'payment_status', 'payment_status_display',
            'stripe_payment_intent_id', 'razorpay_order_id', 'razorpay_payment_id',
            'delivery_slot', 'delivery_slot_detail',
            'estimated_delivery_date', 'actual_delivery_date',
            'created_at', 'updated_at', 'shipped_at', 'delivered_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'shipped_at', 'delivered_at'
        ]


# ============= ORDER CANCELLATION SERIALIZERS =============

class OrderCancellationRequestSerializer(serializers.ModelSerializer):
    """Serializer for cancellation requests"""
    can_cancel = serializers.SerializerMethodField()
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = OrderCancellationRequest
        fields = [
            'id', 'order', 'reason', 'reason_display', 'comments',
            'status', 'status_display', 'can_cancel',
            'requested_at', 'processed_at', 'processed_by', 'admin_notes'
        ]
        read_only_fields = [
            'requested_at', 'processed_at', 'processed_by', 'admin_notes'
        ]
    
    def get_can_cancel(self, obj):
        return obj.can_cancel


class CreateCancellationSerializer(serializers.Serializer):
    """Request serializer for creating cancellation"""
    reason = serializers.ChoiceField(choices=[
        ('change_mind', 'Changed My Mind'),
        ('better_price', 'Found Better Price'),
        ('shipping_time', 'Shipping Takes Too Long'),
        ('out_of_stock', 'Out of Stock'),
        ('found_alternative', 'Found Alternative'),
        ('other', 'Other'),
    ])
    comments = serializers.CharField(required=False, allow_blank=True)


# ============= REFUND SERIALIZERS =============

class RefundSerializer(serializers.ModelSerializer):
    """Serializer for refunds"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_detail = OrderDetailedSerializer(source='order', read_only=True)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'order', 'order_detail', 'refund_amount', 'refund_method',
            'status', 'status_display', 'transaction_id', 'refund_notes',
            'requested_at', 'completed_at'
        ]
        read_only_fields = ['requested_at', 'completed_at']


# ============= DELIVERY SERIALIZERS =============

class OrderDeliverySerializer(serializers.ModelSerializer):
    """Serializer for order delivery tracking"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    delivery_slot_detail = DeliverySlotSerializer(source='delivery_slot', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderDelivery
        fields = [
            'id', 'order', 'delivery_slot', 'delivery_slot_detail',
            'status', 'status_display', 'estimated_delivery_date',
            'actual_delivery_date', 'delivery_partner', 'tracking_number',
            'delivery_attempts', 'last_delivery_attempt', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'last_delivery_attempt'
        ]
    
    def get_is_overdue(self, obj):
        return obj.is_overdue


# ============= NOTIFICATION SERIALIZERS =============

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'notification_type_display',
            'title', 'message', 'is_read', 'read_at',
            'email_sent', 'push_sent', 'created_at'
        ]
        read_only_fields = [
            'email_sent', 'push_sent', 'read_at'
        ]


# ============= PRESCRIPTION SERIALIZERS =============

class PrescriptionDetailSerializer(serializers.ModelSerializer):
    """Detailed prescription serializer"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_valid = serializers.SerializerMethodField()
    pharmacist_name = serializers.CharField(source='assigned_pharmacist.first_name', read_only=True)
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'image', 'status', 'status_display', 'is_verified',
            'expiry_date', 'is_recurring', 'doctor_name', 'is_valid',
            'assigned_pharmacist', 'pharmacist_name',
            'created_at', 'updated_at'
        ]
    
    def get_is_valid(self, obj):
        return obj.is_valid()
