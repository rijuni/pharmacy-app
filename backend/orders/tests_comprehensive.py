"""
Comprehensive test suite for Orders app
Tests cover: Orders, Prescriptions, Cancellations, Refunds, Deliveries
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from orders.models import (
    Order, OrderItem, Prescription, 
    OrderCancellationRequest, Refund, OrderDelivery
)
from products.models import Category, Product, Coupon, DeliverySlot
from users.models import Address

User = get_user_model()


class OrderTests(TestCase):
    """Test Order model and functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        self.address = Address.objects.create(
            user=self.user,
            street="123 Main St",
            city="Test City",
            state="Test State",
            zip_code="12345",
            country="Test Country",
            is_default=True
        )
        self.category = Category.objects.create(name="Tablets")
        self.product = Product.objects.create(
            name="Test Medicine",
            category=self.category,
            price=100.00,
            stock=50
        )
        self.coupon = Coupon.objects.create(
            code="TEST10",
            discount_type="percentage",
            discount_value=10,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timedelta(days=30),
            is_active=True
        )
        self.delivery_slot = DeliverySlot.objects.create(
            start_time="08:00:00",
            end_time="12:00:00",
            capacity=10,
            is_active=True
        )
    
    def test_order_creation(self):
        """Test basic order creation"""
        order = Order.objects.create(
            user=self.user,
            address=self.address,
            subtotal=100.00,
            discount_amount=10.00,
            total_price=90.00,
            status='Pending',
            payment_method='cod'
        )
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.total_price, Decimal('90.00'))
        self.assertEqual(order.status, 'Pending')
    
    def test_order_with_coupon(self):
        """Test order with applied coupon"""
        order = Order.objects.create(
            user=self.user,
            address=self.address,
            subtotal=100.00,
            discount_amount=10.00,
            coupon=self.coupon,
            total_price=90.00
        )
        self.assertEqual(order.coupon, self.coupon)
        self.assertEqual(order.discount_amount, Decimal('10.00'))
    
    def test_order_with_delivery_slot(self):
        """Test order with delivery slot"""
        order = Order.objects.create(
            user=self.user,
            address=self.address,
            delivery_slot=self.delivery_slot,
            estimated_delivery_date=timezone.now().date() + timedelta(days=1),
            total_price=100.00
        )
        self.assertEqual(order.delivery_slot, self.delivery_slot)
    
    def test_order_calculate_total(self):
        """Test order total calculation"""
        order = Order.objects.create(
            user=self.user,
            address=self.address,
            subtotal=100.00,
            discount_amount=10.00,
            tax_amount=5.00,
            shipping_charge=10.00,
            total_price=0
        )
        order.calculate_total()
        order.refresh_from_db()
        # 100 - 10 + 5 + 10 = 105
        self.assertEqual(order.total_price, Decimal('105.00'))
    
    def test_order_status_choices(self):
        """Test valid order status choices"""
        valid_statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return']
        for status in valid_statuses:
            order = Order.objects.create(
                user=self.user,
                address=self.address,
                status=status,
                total_price=100.00
            )
            self.assertEqual(order.status, status)
    
    def test_order_payment_method_choices(self):
        """Test valid payment methods"""
        payment_methods = ['cod', 'card', 'razorpay', 'stripe', 'upi', 'wallet']
        for i, method in enumerate(payment_methods):
            order = Order.objects.create(
                user=self.user,
                address=self.address,
                payment_method=method,
                total_price=100.00,
            )
            self.assertEqual(order.payment_method, method)


class OrderItemTests(TestCase):
    """Test OrderItem functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@test.com')
        self.address = Address.objects.create(user=self.user, street="123 St")
        self.category = Category.objects.create(name="Tablets")
        self.product = Product.objects.create(
            name="Medicine",
            category=self.category,
            price=100.00,
            stock=50
        )
        self.order = Order.objects.create(
            user=self.user,
            address=self.address,
            total_price=200.00
        )
    
    def test_order_item_creation(self):
        """Test creating order item"""
        item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            price=100.00
        )
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.price, Decimal('100.00'))
    
    def test_order_multiple_items(self):
        """Test order with multiple items"""
        product2 = Product.objects.create(
            name="Medicine 2",
            category=self.category,
            price=50.00,
            stock=100
        )
        
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=100.00
        )
        OrderItem.objects.create(
            order=self.order,
            product=product2,
            quantity=2,
            price=50.00
        )
        
        items = self.order.items.all()
        self.assertEqual(items.count(), 2)
        total_value = sum(item.price * item.quantity for item in items)
        self.assertEqual(total_value, Decimal('200.00'))


class PrescriptionTests(TestCase):
    """Test Prescription functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@test.com')
        self.pharmacist = User.objects.create_user(username='pharmacist', email='pharmacist@test.com')
    
    def test_prescription_creation(self):
        """Test creating prescription"""
        prescription = Prescription.objects.create(
            user=self.user,
            image='prescriptions/test.jpg',
            status='Pending',
            expiry_date=timezone.now().date() + timedelta(days=30),
            doctor_name="Dr. Smith"
        )
        self.assertEqual(prescription.status, 'Pending')
        self.assertFalse(prescription.is_verified)
    
    def test_prescription_verification(self):
        """Test prescription verification"""
        prescription = Prescription.objects.create(
            user=self.user,
            image='prescriptions/test.jpg',
            status='Verified',
            is_verified=True,
            assigned_pharmacist=self.pharmacist
        )
        self.assertTrue(prescription.is_verified)
        self.assertEqual(prescription.assigned_pharmacist, self.pharmacist)
    
    def test_prescription_expiry_validation(self):
        """Test prescription validity with expiry date"""
        expired_prescription = Prescription.objects.create(
            user=self.user,
            image='prescriptions/expired.jpg',
            is_verified=True,
            expiry_date=timezone.now().date() - timedelta(days=1)
        )
        self.assertFalse(expired_prescription.is_valid())
    
    def test_prescription_valid_check(self):
        """Test valid prescription"""
        valid_prescription = Prescription.objects.create(
            user=self.user,
            image='prescriptions/valid.jpg',
            is_verified=True,
            expiry_date=timezone.now().date() + timedelta(days=30)
        )
        self.assertTrue(valid_prescription.is_valid())
    
    def test_prescription_recurring_flag(self):
        """Test recurring prescription flag"""
        recurring = Prescription.objects.create(
            user=self.user,
            image='prescriptions/recurring.jpg',
            is_verified=True,
            is_recurring=True,
            doctor_name="Dr. Johnson"
        )
        self.assertTrue(recurring.is_recurring)


class OrderCancellationTests(TestCase):
    """Test Order Cancellation functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@test.com')
        self.address = Address.objects.create(user=self.user, street="123 St")
        self.order = Order.objects.create(
            user=self.user,
            address=self.address,
            status='Processing',
            total_price=100.00,
            created_at=timezone.now()
        )
    
    def test_cancellation_request_creation(self):
        """Test creating cancellation request"""
        cancel_request = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='change_mind',
            comments="Changed my mind"
        )
        self.assertEqual(cancel_request.status, 'pending')
        self.assertTrue(cancel_request.can_cancel)
    
    def test_cancellation_within_time_window(self):
        """Test cancellation is allowed within 30 mins"""
        cancel_request = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='change_mind'
        )
        self.assertTrue(cancel_request.can_cancel)
    
    def test_cancellation_after_time_window(self):
        """Test cancellation not allowed after 30 mins"""
        # Create order 31 minutes ago
        old_order = Order.objects.create(
            user=self.user,
            address=self.address,
            status='Processing',
            total_price=100.00,
            created_at=timezone.now() - timedelta(minutes=31)
        )
        
        cancel_request = OrderCancellationRequest.objects.create(
            order=old_order,
            user=self.user,
            reason='change_mind'
        )
        self.assertFalse(cancel_request.can_cancel)
    
    def test_cancellation_not_allowed_shipped(self):
        """Test cancellation not allowed for shipped order"""
        self.order.status = 'Shipped'
        self.order.save()
        
        cancel_request = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='change_mind'
        )
        self.assertFalse(cancel_request.can_cancel)
    
    def test_cancellation_reason_choices(self):
        """Test all cancellation reasons"""
        reasons = [
            'change_mind', 'better_price', 'shipping_time',
            'out_of_stock', 'found_alternative', 'other'
        ]
        
        for i, reason in enumerate(reasons):
            cancel_order = Order.objects.create(
                user=self.user,
                address=self.address,
                status='Processing',
                total_price=100.00
            )
            cancel_request = OrderCancellationRequest.objects.create(
                order=cancel_order,
                user=self.user,
                reason=reason
            )
            self.assertEqual(cancel_request.reason, reason)


class RefundTests(TestCase):
    """Test Refund functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@test.com')
        self.address = Address.objects.create(user=self.user, street="123 St")
        self.order = Order.objects.create(
            user=self.user,
            address=self.address,
            total_price=100.00,
            payment_status='completed'
        )
        self.cancellation = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='change_mind',
            status='approved'
        )
    
    def test_refund_creation(self):
        """Test creating refund"""
        refund = Refund.objects.create(
            order=self.order,
            cancellation_request=self.cancellation,
            refund_amount=100.00,
            refund_method='original_payment',
            status='processing'
        )
        self.assertEqual(refund.refund_amount, Decimal('100.00'))
        self.assertEqual(refund.status, 'processing')
    
    def test_refund_completion(self):
        """Test completing refund"""
        refund = Refund.objects.create(
            order=self.order,
            refund_amount=100.00,
            refund_method='original_payment',
            status='completed',
            transaction_id='TXN123456'
        )
        self.assertEqual(refund.status, 'completed')
        self.assertIsNotNone(refund.transaction_id)
    
    def test_refund_status_choices(self):
        """Test all refund statuses"""
        statuses = ['pending', 'processing', 'completed', 'failed']
        
        for status in statuses:
            refund = Refund.objects.create(
                order=self.order,
                refund_amount=100.00,
                refund_method='wallet',
                status=status
            )
            self.assertEqual(refund.status, status)


class OrderDeliveryTests(TestCase):
    """Test Order Delivery functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@test.com')
        self.address = Address.objects.create(user=self.user, street="123 St")
        self.delivery_slot = DeliverySlot.objects.create(
            start_time="08:00:00",
            end_time="12:00:00",
            capacity=10,
            is_active=True
        )
        self.order = Order.objects.create(
            user=self.user,
            address=self.address,
            total_price=100.00,
            delivery_slot=self.delivery_slot,
            estimated_delivery_date=timezone.now().date() + timedelta(days=1)
        )
    
    def test_delivery_creation(self):
        """Test creating delivery record"""
        delivery = OrderDelivery.objects.create(
            order=self.order,
            delivery_slot=self.delivery_slot,
            estimated_delivery_date=timezone.now().date() + timedelta(days=1),
            status='pending'
        )
        self.assertEqual(delivery.status, 'pending')
    
    def test_delivery_status_progression(self):
        """Test delivery status flow"""
        delivery = OrderDelivery.objects.create(
            order=self.order,
            estimated_delivery_date=timezone.now().date() + timedelta(days=1)
        )
        
        # Assign delivery partner
        delivery.status = 'assigned'
        delivery.delivery_partner = 'ABC Courier'
        delivery.tracking_number = 'TRACK123'
        delivery.save()
        self.assertEqual(delivery.status, 'assigned')
        
        # Mark as in transit
        delivery.status = 'in_transit'
        delivery.save()
        self.assertEqual(delivery.status, 'in_transit')
        
        # Mark as delivered
        delivery.status = 'delivered'
        delivery.actual_delivery_date = timezone.now().date()
        delivery.save()
        self.assertEqual(delivery.status, 'delivered')
    
    def test_delivery_overdue_detection(self):
        """Test detecting overdue deliveries"""
        past_date = timezone.now().date() - timedelta(days=1)
        delivery = OrderDelivery.objects.create(
            order=self.order,
            estimated_delivery_date=past_date,
            status='pending'
        )
        self.assertTrue(delivery.is_overdue)
    
    def test_delivery_not_overdue(self):
        """Test non-overdue delivery"""
        future_date = timezone.now().date() + timedelta(days=2)
        delivery = OrderDelivery.objects.create(
            order=self.order,
            estimated_delivery_date=future_date,
            status='pending'
        )
        self.assertFalse(delivery.is_overdue)
    
    def test_delivery_failed_attempt(self):
        """Test failed delivery attempt"""
        delivery = OrderDelivery.objects.create(
            order=self.order,
            estimated_delivery_date=timezone.now().date(),
            status='pending'
        )
        
        delivery.delivery_attempts = 1
        delivery.last_delivery_attempt = timezone.now()
        delivery.status = 'failed'
        delivery.save()
        
        self.assertEqual(delivery.delivery_attempts, 1)
        self.assertEqual(delivery.status, 'failed')
    
    def test_delivery_multiple_attempts(self):
        """Test multiple delivery attempts"""
        delivery = OrderDelivery.objects.create(
            order=self.order,
            estimated_delivery_date=timezone.now().date() + timedelta(days=1),
            status='pending'
        )
        
        # First attempt
        delivery.delivery_attempts = 1
        delivery.last_delivery_attempt = timezone.now()
        delivery.status = 'failed'
        delivery.save()
        
        # Retry next day
        delivery.estimated_delivery_date = timezone.now().date() + timedelta(days=2)
        delivery.delivery_attempts = 2
        delivery.last_delivery_attempt = timezone.now()
        delivery.status = 'pending'
        delivery.save()
        
        self.assertEqual(delivery.delivery_attempts, 2)
