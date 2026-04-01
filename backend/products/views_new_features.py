"""
API Views for new features (coupons, stock, favorites, etc.)
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from decimal import Decimal

from .models import (
    Coupon, CouponUsage, ProductStock, StockMovement, Favorite,
    DrugInteraction, DeliverySlot, Notification, Product
)
from .serializers import (
    CouponSerializer, CouponValidationSerializer, CouponUsageSerializer,
    ProductStockSerializer, StockMovementSerializer, FavoriteSerializer,
    DrugInteractionSerializer, InteractionCheckSerializer, DeliverySlotSerializer,
    NotificationSerializer
)
from backend_project.validators import (
    CouponValidator, StockValidator, PrescriptionValidator, DeliveryValidator
)
from backend_project.utils import (
    rate_limit_decorator, log_action, get_client_ip,
    calculate_discount_for_coupon
)


# ============= COUPON/DISCOUNT VIEWS =============
class CouponViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Coupon management
    List available coupons, validate coupon codes
    """
    queryset = Coupon.objects.filter(is_active=True)
    serializer_class = CouponSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def validate(self, request):
        """
        Validate a coupon code and calculate discount
        POST: {
            "code": "SAVE10",
            "cart_total": 1000
        }
        """
        serializer = CouponValidationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        coupon = serializer.validated_data['code']
        cart_total = Decimal(request.data.get('cart_total', 0))

        # Check if user has already used this coupon
        user_usage_count = 0
        if request.user.is_authenticated:
            user_usage_count = CouponUsage.objects.filter(
                coupon=coupon,
                user=request.user
            ).count()

        # Validate coupon for user
        is_valid, error = CouponValidator.validate_for_user(
            coupon, 
            request.user if request.user.is_authenticated else None,
            cart_total,
            user_usage_count
        )

        if not is_valid:
            return Response(
                {'error': error},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate discount
        discount_amount = calculate_discount_for_coupon(coupon, cart_total)
        final_total = cart_total - discount_amount

        return Response({
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': coupon.discount_value,
            'cart_total': cart_total,
            'discount_amount': discount_amount,
            'final_total': final_total,
            'remaining_uses': coupon.max_uses_per_user - user_usage_count if coupon.max_uses_per_user else 'unlimited'
        })

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """
        Apply coupon to the current cart/order
        Only authenticated users
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        coupon = self.get_object()
        cart_total = Decimal(request.data.get('cart_total', 0))

        # Validate and apply
        is_valid, error = CouponValidator.validate_for_user(
            coupon,
            request.user,
            cart_total,
            CouponUsage.objects.filter(coupon=coupon, user=request.user).count()
        )

        if not is_valid:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        log_action('coupon_validated', {'coupon_code': coupon.code}, user=request.user)

        discount_amount = calculate_discount_for_coupon(coupon, cart_total)
        return Response({
            'success': True,
            'discount_amount': discount_amount,
            'final_total': cart_total - discount_amount
        })


# ============= PRODUCT STOCK VIEWS =============
class ProductStockViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Product stock information (read-only for customers)
    """
    queryset = ProductStock.objects.all()
    serializer_class = ProductStockSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all products with low stock"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        low_stock_items = ProductStock.objects.filter(
            is_low_stock=True,
            available_stock__gt=0
        )

        serializer = ProductStockSerializer(low_stock_items, many=True)
        return Response(serializer.data)


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Stock movement history (admin only)
    """
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        qs = StockMovement.objects.all()
        
        # Filter by product
        product_id = self.request.query_params.get('product_id')
        if product_id:
            qs = qs.filter(product_id=product_id)
        
        # Filter by movement type
        movement_type = self.request.query_params.get('type')
        if movement_type:
            qs = qs.filter(movement_type=movement_type)
        
        return qs.order_by('-moved_at')


# ============= FAVORITES/WISHLIST VIEWS =============
class FavoriteViewSet(viewsets.ViewSet):
    """
    User's favorite/wishlist products
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get user's favorites"""
        favorites = Favorite.objects.filter(user=request.user).select_related('product')
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Add product to favorites"""
        product_id = request.data.get('product_id')
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            product=product
        )

        if not created:
            return Response(
                {'message': 'Already in favorites'},
                status=status.HTTP_200_OK
            )

        log_action('favorite_added', {'product_id': product_id}, user=request.user)
        serializer = FavoriteSerializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        """Remove product from favorites"""
        favorite = get_object_or_404(Favorite, id=pk, user=request.user)
        product_name = favorite.product.name
        favorite.delete()
        
        log_action('favorite_removed', {'product_name': product_name}, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check if product is in favorites"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_favorited = Favorite.objects.filter(
            user=request.user,
            product_id=product_id
        ).exists()

        return Response({'is_favorited': is_favorited})


# ============= DRUG INTERACTION VIEWS =============
class DrugInteractionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Drug interaction information
    """
    queryset = DrugInteraction.objects.all()
    serializer_class = DrugInteractionSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def check(self, request):
        """
        Check for interactions between multiple drugs
        POST: {"product_ids": [1, 2, 3]}
        """
        serializer = InteractionCheckSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product_ids = serializer.validated_data['product_ids']
        
        try:
            products = Product.objects.filter(id__in=product_ids, requires_prescription=True)
            if products.count() < 2:
                return Response({
                    'warning': 'At least 2 prescription items required for interaction check',
                    'interactions': []
                })

            interactions = DrugInteraction.check_interactions(products)
            
            if interactions:
                serializer = DrugInteractionSerializer(interactions, many=True)
                return Response({
                    'has_interactions': True,
                    'warning': 'Some drug interactions detected',
                    'interactions': serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'has_interactions': False,
                    'message': 'No known interactions found',
                    'interactions': []
                })
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============= DELIVERY SLOT VIEWS =============
class DeliverySlotViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Available delivery time slots
    """
    queryset = DeliverySlot.objects.filter(is_active=True).order_by('start_time')
    serializer_class = DeliverySlotSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Filter out fully booked slots
        return super().get_queryset().filter(
            current_bookings__lt=Decimal('capacity')
        )

    @action(detail=True, methods=['post'])
    def book(self, request, pk=None):
        """
        Book a delivery slot (called during order checkout)
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        slot = self.get_object()
        
        if not slot.can_book():
            return Response(
                {'error': 'Cannot book this slot. It may be full or inactive.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Increase booking count
        slot.current_bookings += 1
        slot.save()

        log_action('delivery_slot_booked', {'slot_id': slot.id}, user=request.user)

        return Response({
            'success': True,
            'message': 'Delivery slot booked',
            'slot_id': slot.id,
            'time_window': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
        })


# ============= NOTIFICATION VIEWS =============
class NotificationViewSet(viewsets.ViewSet):
    """
    User notifications
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get user's notifications"""
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        
        # Filter by read status
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            is_read = is_read.lower() == 'true'
            notifications = notifications.filter(is_read=is_read)
        
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'success': True, 'message': 'All notifications marked as read'})

    @action(detail=False, methods=['post'], url_path='(?P<pk>\\d+)/mark-read')
    def mark_as_read(self, request, pk=None):
        """Mark specific notification as read"""
        try:
            notification = Notification.objects.get(id=pk, user=request.user)
            notification.mark_as_read()
            return Response({'success': True})
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def destroy(self, request, pk=None):
        """Delete a notification"""
        notification = get_object_or_404(Notification, id=pk, user=request.user)
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
