"""
Tests for orders app - covering cancellations, refunds, delivery, etc.
"""
import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from orders.models import (
    Order, OrderItem, Prescription, OrderCancellationRequest,
    Refund, OrderDelivery
)
from products.models import Category, Product, DeliverySlot
from users.models import User, Address


@pytest.mark.django_db
class TestOrderCancellation(TestCase):
    """Test Order Cancellation functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="customer@example.com",
            phone_number="9999999999",
            password="test123"
        )
        
        self.address = Address.objects.create(
            user=self.user,
            street="123 Main St",
            city="Mumbai",
            state="Maharashtra",
            zip_code="400001"
        )
        
        self.order = Order.objects.create(
            user=self.user,
            address=self.address,
            total_price=Decimal("1000"),
            status='Pending',
            payment_method='cod'
        )
    
    def test_create_cancellation_request(self):
        """Test creating cancellation request"""
        cancellation = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='change_mind',
            comments='Changed my mind'
        )
        
        assert cancellation.order == self.order
        assert cancellation.status == 'pending'
    
    def test_can_cancel_within_window(self):
        """Test cancellation within 30 minute window"""
        # Order created now
        cancellation = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='change_mind'
        )
        
        assert cancellation.can_cancel is True
    
    def test_cannot_cancel_after_window(self):
        """Test cannot cancel after window expires"""
        # Create order 1 hour ago
        self.order.created_at = timezone.now() - timedelta(hours=1)
        self.order.save()
        
        cancellation = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='change_mind'
        )
        
        assert cancellation.can_cancel is False
    
    def test_cannot_cancel_shipped_order(self):
        """Test cannot cancel shipped/delivered orders"""
        self.order.status = 'Shipped'
        self.order.save()
        
        cancellation = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='change_mind'
        )
        
        assert cancellation.can_cancel is False


@pytest.mark.django_db
class TestRefund(TestCase):
    """Test Refund processing"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="buyer@example.com",
            phone_number="8888888888",
            password="test123"
        )
        
        self.address = Address.objects.create(
            user=self.user,
            street="456 Sub St",
            city="Delhi",
            state="Delhi",
            zip_code="110001"
        )
        
        self.order = Order.objects.create(
            user=self.user,
            address=self.address,
            total_price=Decimal("2000"),
            status='Pending',
            payment_status='completed'
        )
        
        self.cancellation = OrderCancellationRequest.objects.create(
            order=self.order,
            user=self.user,
            reason='better_price'
        )
    
    def test_create_refund(self):
        """Test creating refund"""
        refund = Refund.objects.create(
            order=self.order,
            cancellation_request=self.cancellation,
            refund_amount=Decimal("2000"),
            refund_method='original_payment',
            status='pending'
        )
        
        assert refund.refund_amount == Decimal("2000")
        assert refund.status == 'pending'
    
    def test_refund_processing(self):
        """Test refund status updates"""
        refund = Refund.objects.create(
            order=self.order,
            refund_amount=Decimal("2000"),
            refund_method='original_payment'
        )
        
        # Simulate processing
        refund.status = 'processing'
        refund.transaction_id = 'TXN123456'
        refund.save()
        
        assert refund.status == 'processing'
        assert refund.transaction_id is not None
    
    def test_refund_completion(self):
        """Test completing refund"""
        refund = Refund.objects.create(
            order=self.order,
            refund_amount=Decimal("2000"),
            refund_method='original_payment'
        )
        
        refund.status = 'completed'
        refund.completed_at = timezone.now()
        refund.save()
        
        assert refund.status == 'completed'
        assert refund.completed_at is not None


@pytest.mark.django_db
class TestOrderDelivery(TestCase):
    """Test Order Delivery tracking"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="recipient@example.com",
            phone_number="7777777777",
            password="test123"
        )
        
        self.address = Address.objects.create(
            user=self.user,
            street="789 Delivery Ave",
            city="Bangalore",
            state="Karnataka",
            zip_code="560001"
        )
        
        self.order = Order.objects.create(
            user=self.user,
            address=self.address,
            total_price=Decimal("1500"),
            status='Processing'
        )
        
        from datetime import time
        self.delivery_slot = DeliverySlot.objects.create(
            start_time=time(10, 0),
            end_time=time(13, 0),
            capacity=20
        )
    
    def test_create_delivery(self):
        """Test creating delivery record"""
        delivery = OrderDelivery.objects.create(
            order=self.order,
            delivery_slot=self.delivery_slot,
            estimated_delivery_date=timezone.now().date() + timedelta(days=2),
            status='pending'
        )
        
        assert delivery.order == self.order
        assert delivery.status == 'pending'
    
    def test_delivery_in_transit(self):
        """Test delivery status updates"""
        delivery = OrderDelivery.objects.create(
            order=self.order,
            estimated_delivery_date=timezone.now().date() + timedelta(days=1),
            status='assigned',
            delivery_partner='FedEx'
        )
        
        delivery.status = 'in_transit'
        delivery.tracking_number = 'FX123456789'
        delivery.save()
        
        assert delivery.status == 'in_transit'
        assert delivery.tracking_number is not None
    
    def test_delivery_completed(self):
        """Test delivery completion"""
        delivery = OrderDelivery.objects.create(
            order=self.order,
            estimated_delivery_date=timezone.now().date() + timedelta(days=1),
            status='in_transit'
        )
        
        delivery.status = 'delivered'
        delivery.actual_delivery_date = timezone.now().date()
        delivery.save()
        
        assert delivery.status == 'delivered'
        assert delivery.actual_delivery_date is not None
    
    def test_overdue_delivery(self):
        """Test detecting overdue deliveries"""
        delivery = OrderDelivery.objects.create(
            order=self.order,
            estimated_delivery_date=timezone.now().date() - timedelta(days=1),
            status='in_transit'
        )
        
        assert delivery.is_overdue is True


@pytest.mark.django_db
class TestPrescriptionValidation(TestCase):
    """Test Prescription validation and expiry"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="patient@example.com",
            phone_number="6666666666",
            password="test123"
        )
    
    def test_prescription_expiry_date(self):
        """Test prescription with expiry date"""
        prescription = Prescription.objects.create(
            user=self.user,
            image='test.jpg',
            status='Verified',
            is_verified=True,
            expiry_date=timezone.now().date() - timedelta(days=1)
        )
        
        assert prescription.is_valid() is False
    
    def test_prescription_not_expired(self):
        """Test valid prescription"""
        prescription = Prescription.objects.create(
            user=self.user,
            image='test.jpg',
            status='Verified',
            is_verified=True,
            expiry_date=timezone.now().date() + timedelta(days=30)
        )
        
        assert prescription.is_valid() is True
    
    def test_unverified_prescription(self):
        """Test unverified prescription is invalid"""
        prescription = Prescription.objects.create(
            user=self.user,
            image='test.jpg',
            status='Pending',
            is_verified=False
        )
        
        assert prescription.is_valid() is False
    
    def test_recurring_prescription(self):
        """Test recurring prescription flag"""
        prescription = Prescription.objects.create(
            user=self.user,
            image='test.jpg',
            status='Verified',
            is_verified=True,
            is_recurring=True,
            expiry_date=timezone.now().date() + timedelta(days=90)
        )
        
        assert prescription.is_recurring is True
        assert prescription.is_valid() is True
