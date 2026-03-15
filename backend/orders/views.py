from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Cart, CartItem, Order, OrderItem, Prescription
from products.models import Product
from users.models import Address
from .serializers import CartSerializer, OrderSerializer, PrescriptionSerializer
import stripe
import os

# Set Stripe API Key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_key_here')

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
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

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
        
        # Calculate total price
        total_price = sum(item.product.price * item.quantity for item in cart.items.all())
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            address=address,
            total_price=total_price,
            payment_method=payment_method,
            payment_status='completed' if payment_method == 'card' else 'pending'
        )
        
        # Create order items
        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )
        
        # Clear cart
        cart.items.all().delete()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Prescription.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
