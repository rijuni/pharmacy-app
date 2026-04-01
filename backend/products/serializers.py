from rest_framework import serializers
from .models import (Category, Product, Review, Coupon, CouponUsage, ProductStock, 
                     StockMovement, Favorite, DrugInteraction, DeliverySlot, Notification)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'username', 'product', 'rating', 'comment', 'created_at']
        read_only_fields = ['user']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_available = serializers.SerializerMethodField()
    substitutes = serializers.SerializerMethodField()
    average_rating = serializers.ReadOnlyField()
    reviews = ReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'generic_name', 'category', 'category_name',
            'description', 'price', 'stock', 'image', 'requires_prescription',
            'availability_status', 'manufacturer', 'strength', 'form',
            'salt_composition', 'side_effects', 'expert_tips', 'interactions', 'how_to_use',
            'is_available', 'substitutes', 'average_rating', 'reviews', 
            'created_at', 'updated_at'
        ]
    
    def get_is_available(self, obj):
        return obj.is_available

    def get_substitutes(self, obj):
        if not obj.salt_composition:
            return []
        
        # Find other products with the same salt composition, excluding current product
        substitutes = Product.objects.filter(
            salt_composition__icontains=obj.salt_composition
        ).exclude(id=obj.id)[:5]
        
        # Return simplified version of substitutes to avoid deep nesting
        return [{
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'image': p.image.url if p.image else None,
            'manufacturer': p.manufacturer
        } for p in substitutes]


# ============= COUPON/DISCOUNT SERIALIZERS =============
class CouponSerializer(serializers.ModelSerializer):
    applicable_product_ids = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        many=True, 
        write_only=True, 
        required=False,
        source='applicable_to_products'
    )
    applicable_category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        many=True, 
        write_only=True, 
        required=False,
        source='applicable_to_categories'
    )
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_purchase_amount', 'max_discount_amount', 'max_uses', 'max_uses_per_user',
            'applicable_product_ids', 'applicable_category_ids', 
            'valid_from', 'valid_to', 'is_active', 'times_used', 'is_valid',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['times_used', 'created_at', 'updated_at']

    def get_is_valid(self, obj):
        return obj.is_valid


class CouponValidationSerializer(serializers.Serializer):
    """Validate coupon and calculate discount"""
    code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate_code(self, value):
        try:
            coupon = Coupon.objects.get(code=value.upper())
            if not coupon.is_valid:
                raise serializers.ValidationError("This coupon is no longer valid.")
            return coupon
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code.")


class CouponUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouponUsage
        fields = ['id', 'coupon', 'user', 'order', 'discount_amount', 'used_at']
        read_only_fields = ['used_at']


# ============= STOCK MANAGEMENT SERIALIZERS =============
class ProductStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = ProductStock
        fields = [
            'id', 'product', 'product_name', 'total_stock', 'reserved_stock', 
            'available_stock', 'last_restocked', 'low_stock_threshold',
            'is_low_stock', 'updated_at'
        ]
        read_only_fields = ['product_name', 'reserved_stock', 'available_stock', 'updated_at']


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'quantity',
            'notes', 'order', 'moved_at'
        ]
        read_only_fields = ['product_name', 'moved_at']


# ============= FAVORITES/WISHLIST SERIALIZERS =============
class FavoriteSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'product', 'product_details', 'added_at']
        read_only_fields = ['user', 'added_at']


# ============= DRUG INTERACTION SERIALIZERS =============
class DrugInteractionSerializer(serializers.ModelSerializer):
    drug1_name = serializers.CharField(source='drug1.name', read_only=True)
    drug2_name = serializers.CharField(source='drug2.name', read_only=True)

    class Meta:
        model = DrugInteraction
        fields = [
            'id', 'drug1', 'drug1_name', 'drug2', 'drug2_name',
            'description', 'severity', 'recommendation', 'created_at'
        ]
        read_only_fields = ['drug1_name', 'drug2_name', 'created_at']


class InteractionCheckSerializer(serializers.Serializer):
    """Check for interactions between products"""
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=2,
        max_length=10
    )


# ============= DELIVERY SLOT SERIALIZERS =============
class DeliverySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverySlot
        fields = [
            'id', 'start_time', 'end_time', 'capacity', 'current_bookings',
            'available_capacity', 'is_active', 'is_full', 'can_book'
        ]
        read_only_fields = ['available_capacity', 'is_full', 'can_book']


# ============= NOTIFICATION SERIALIZERS =============
class NotificationSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True, allow_null=True)
    product_name = serializers.CharField(source='product.name', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message',
            'order_id', 'product_name', 'is_read', 'read_at',
            'email_sent', 'push_sent', 'created_at'
        ]
        read_only_fields = [
            'user', 'is_read', 'read_at', 'email_sent', 'push_sent', 'created_at'
        ]

    def to_representation(self, instance):
        """Remove None values for cleaner API response"""
        ret = super().to_representation(instance)
        return {k: v for k, v in ret.items() if v is not None}
