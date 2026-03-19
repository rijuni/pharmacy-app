from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Cart, CartItem, Order, OrderItem, Prescription
from products.models import Product
from users.models import Address
from .serializers import CartSerializer, OrderSerializer, PrescriptionSerializer
import stripe
import razorpay
import os
from django.conf import settings
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta

# Set Stripe API Key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_key_here')

# Initialize Razorpay Client
razorpay_client = razorpay.Client(
    auth=(getattr(settings, 'RAZORPAY_KEY_ID', ''), getattr(settings, 'RAZORPAY_KEY_SECRET', ''))
)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_to_cart(request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))
    
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
    cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    if not created:
        cart_item.quantity += quantity
    else:
        cart_item.quantity = quantity
    cart_item.save()
    
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_from_cart(request):
    cart = Cart.objects.get(user=request.user)
    product_id = request.data.get('product_id')
    CartItem.objects.filter(cart=cart, product_id=product_id).delete()
    
    serializer = CartSerializer(cart)
    return Response(serializer.data)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'detail': 'Cart not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle both 'delivery_address' and 'address'/'address_id' parameter names
        address_id = request.data.get('delivery_address') or request.data.get('address') or request.data.get('address_id')
        
        if not address_id:
            return Response({'detail': 'Address is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            address = Address.objects.get(id=address_id)
        except Address.DoesNotExist:
            return Response({'detail': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not cart.items.exists():
            return Response({'detail': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate prescriptions for Rx medicines
        for item in cart.items.all():
            if item.product.requires_prescription:
                has_valid_prescription = Prescription.objects.filter(
                    user=request.user,
                    is_verified=True
                ).exists()
                
                if not has_valid_prescription:
                    return Response(
                        {'detail': f'{item.product.name} requires a valid prescription. Please upload a prescription.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        # Check if payment is required and if payment_intent_id was provided
        payment_method = request.data.get('payment_method', 'cod')
        
        if payment_method == 'card':
            payment_intent_id = request.data.get('payment_intent_id')
            if not payment_intent_id:
                return Response(
                    {'detail': 'Payment intent is required for card payments'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                # Verify payment intent
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                if intent.status != 'succeeded':
                    return Response(
                        {'detail': 'Payment not successful'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except stripe.error.InvalidRequestError:
                return Response(
                    {'detail': 'Invalid payment intent'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validate stock levels
        for item in cart.items.all():
            if item.product.stock < item.quantity:
                return Response(
                    {'detail': f'Insufficient stock for {item.product.name}. Available: {item.product.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Calculate total price
        total_price = sum(item.product.price * item.quantity for item in cart.items.all())
        
        with transaction.atomic():
            # Create order
            order = Order.objects.create(
                user=request.user,
                address=address,
                total_price=total_price,
                payment_method=payment_method,
                payment_status='completed' if payment_method in ['card', 'razorpay'] else 'pending',
                stripe_payment_intent_id=request.data.get('payment_intent_id') if payment_method == 'card' else None,
                razorpay_order_id=request.data.get('razorpay_order_id') if payment_method == 'razorpay' else None,
                razorpay_payment_id=request.data.get('razorpay_payment_id') if payment_method == 'razorpay' else None,
                razorpay_signature=request.data.get('razorpay_signature') if payment_method == 'razorpay' else None
            )
            
            # Create order items and reduce stock
            for item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.price
                )
                
                # Reduce stock
                product = item.product
                product.stock -= item.quantity
                if product.stock == 0:
                    product.availability_status = 'out_of_stock'
                    product.is_available = False
                product.save()
            
            # Clear cart
            cart.items.all().delete()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Staff can see all prescriptions, users only see their own
        if self.request.user.is_staff:
            return Prescription.objects.all().order_by('-created_at')
        return Prescription.objects.filter(user=self.request.user).order_by('-created_at')
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            # For now, let users update their own or staff update any
            # In a strict app, we might restrict update to staff for 'is_verified'
            return [permissions.IsAuthenticated()]
        return super().get_permissions()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    """Create a Stripe Payment Intent for card payment"""
    try:
        cart = Cart.objects.get(user=request.user)
    except Cart.DoesNotExist:
        return Response({'detail': 'Cart not found'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not cart.items.exists():
        return Response({'detail': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate amount in cents (Stripe uses smallest currency unit)
    amount = int(sum(item.product.price * item.quantity for item in cart.items.all()) * 100)
    
    try:
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='inr',  # Use INR for Indian pharmacy
            metadata={
                'user_id': request.user.id,
                'user_email': request.user.email,
                'cart_items': ','.join([f"{item.product.name}(x{item.quantity})" for item in cart.items.all()])
            }
        )
        
        return Response({
            'clientSecret': intent.client_secret,
            'paymentIntentId': intent.id,
            'amount': amount / 100  # Return in rupees
        }, status=status.HTTP_200_OK)
    
    except stripe.error.CardError as e:
        return Response({'detail': f'Card error: {e.user_message}'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.RateLimitError:
        return Response({'detail': 'Too many requests. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    except stripe.error.InvalidRequestError as e:
        return Response({'detail': f'Invalid request: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.AuthenticationError:
        return Response({'detail': 'Stripe authentication failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except stripe.error.APIConnectionError:
        return Response({'detail': 'API connection error. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except stripe.error.StripeError as e:
        return Response({'detail': f'Stripe error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_razorpay_order(request):
    """Create a Razorpay Order for online payment"""
    try:
        cart = Cart.objects.get(user=request.user)
    except Cart.DoesNotExist:
        return Response({'detail': 'Cart not found'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not cart.items.exists():
        return Response({'detail': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate amount in paise (Razorpay uses smallest currency unit)
    amount = int(sum(item.product.price * item.quantity for item in cart.items.all()) * 100)
    
    data = {
        'amount': amount,
        'currency': 'INR',
        'payment_capture': '1'  # Auto capture
    }
    
    try:
        razorpay_order = razorpay_client.order.create(data=data)
        return Response({
            'order_id': razorpay_order['id'],
            'amount': amount,
            'currency': 'INR',
            'key_id': settings.RAZORPAY_KEY_ID
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'detail': f'Razorpay error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_razorpay_payment(request):
    """Verify Razorpay payment signature"""
    data = request.data
    try:
        # Check signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': data.get('razorpay_order_id'),
            'razorpay_payment_id': data.get('razorpay_payment_id'),
            'razorpay_signature': data.get('razorpay_signature')
        })
        return Response({'status': 'Payment verified'}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'detail': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def export_inventory_csv(request):
    """Export product inventory to CSV"""
    import csv
    from django.http import HttpResponse
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="inventory_report.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['ID', 'Name', 'Category', 'Price', 'Stock', 'Availability', 'Manufacturer'])
    
    products = Product.objects.all().select_related('category')
    for p in products:
        writer.writerow([
            p.id, p.name, p.category.name if p.category else 'N/A', 
            p.price, p.stock, p.availability_status, p.manufacturer
        ])
    
    return response

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_admin_reports(request):
    """Get summarized reports for admin dashboard"""
    from django.db.models import Sum, Count, F
    from django.utils import timezone
    from datetime import timedelta
    # Time periods
    today = timezone.now().date()
    
    # Sales Stats
    total_sales = Order.objects.filter(payment_status='completed').aggregate(sum=Sum('total_price'))['sum'] or 0
    today_sales = Order.objects.filter(created_at__date=today, payment_status='completed').aggregate(sum=Sum('total_price'))['sum'] or 0
    
    # Order Status counts
    order_status_counts = Order.objects.values('status').annotate(count=Count('id'))
    
    # Inventory stats
    total_products = Product.objects.count()
    low_stock_products = Product.objects.filter(stock__lte=10, stock__gt=0).count()
    out_of_stock_products = Product.objects.filter(stock=0).count()
    
    # Top selling medications
    top_selling = OrderItem.objects.values(
        'product__name', 'product__id'
    ).annotate(
        total_quantity=Sum('quantity'),
        total_revenue=Sum(F('quantity') * F('price'))
    ).order_by('-total_quantity')[:10]

    return Response({
        'sales': {
            'total_lifetime': total_sales,
            'today': today_sales,
            'status_distribution': {item['status']: item['count'] for item in order_status_counts}
        },
        'inventory': {
            'total_items': total_products,
            'low_stock_count': low_stock_products,
            'out_of_stock_count': out_of_stock_products
        },
        'top_selling': list(top_selling),
    })
