"""
Tests for products app - covering coupons, stock, favorites, etc.
"""
import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from products.models import (
    Category, Product, Coupon, ProductStock, StockMovement,
    Favorite, DrugInteraction, DeliverySlot, Notification
)
from users.models import User


@pytest.mark.django_db
class TestCoupon(TestCase):
    """Test Coupon model and functionality"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Pain Relief")
        self.product = Product.objects.create(
            name="Paracetamol",
            category=self.category,
            price=Decimal("50.00"),
            stock=100
        )
        
        self.valid_coupon = Coupon.objects.create(
            code="SAVE10",
            discount_type="percentage",
            discount_value=Decimal("10"),
            valid_from=timezone.now() - timedelta(days=1),
            valid_to=timezone.now() + timedelta(days=30),
            is_active=True
        )
    
    def test_coupon_creation(self):
        """Test coupon creation"""
        assert self.valid_coupon.code == "SAVE10"
        assert self.valid_coupon.is_valid is True
    
    def test_coupon_percentage_discount(self):
        """Test percentage discount calculation"""
        discount = self.valid_coupon.calculate_discount(Decimal("1000"))
        assert discount == Decimal("100")
    
    def test_coupon_fixed_discount(self):
        """Test fixed amount discount"""
        fixed_coupon = Coupon.objects.create(
            code="FLAT50",
            discount_type="fixed",
            discount_value=Decimal("50"),
            valid_from=timezone.now(),
            valid_to=timezone.now() + timedelta(days=30)
        )
        
        discount = fixed_coupon.calculate_discount(Decimal("1000"))
        assert discount == Decimal("50")
    
    def test_coupon_validity_expired(self):
        """Test expired coupon is invalid"""
        expired_coupon = Coupon.objects.create(
            code="EXPIRED",
            discount_type="percentage",
            discount_value=Decimal("10"),
            valid_from=timezone.now() - timedelta(days=30),
            valid_to=timezone.now() - timedelta(days=1),
            is_active=True
        )
        
        assert expired_coupon.is_valid is False
    
    def test_coupon_max_uses(self):
        """Test coupon max uses limit"""
        limited_coupon = Coupon.objects.create(
            code="LIMITED5",
            discount_type="percentage",
            discount_value=Decimal("20"),
            max_uses=5,
            valid_from=timezone.now(),
            valid_to=timezone.now() + timedelta(days=30)
        )
        
        # Use coupon 5 times
        for i in range(5):
            limited_coupon.times_used += 1
            limited_coupon.save()
        
        assert limited_coupon.is_valid is False


@pytest.mark.django_db
class TestProductStock(TestCase):
    """Test ProductStock model and stock management"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Medicines")
        self.product = Product.objects.create(
            name="Ibuprofen",
            category=self.category,
            price=Decimal("100"),
            stock=100
        )
        
        self.stock_info = ProductStock.objects.create(
            product=self.product,
            total_stock=100,
            available_stock=100,
            reserved_stock=0
        )
    
    def test_reserve_stock(self):
        """Test reserving stock"""
        self.stock_info.reserve_stock(10)
        assert self.stock_info.available_stock == 90
        assert self.stock_info.reserved_stock == 10
    
    def test_insufficient_stock(self):
        """Test reserving more stock than available"""
        with pytest.raises(Exception):
            self.stock_info.reserve_stock(150)
    
    def test_low_stock_threshold(self):
        """Test low stock detection"""
        self.stock_info.low_stock_threshold = 20
        self.stock_info.available_stock = 15
        assert self.stock_info.is_low_stock is True
    
    def test_stock_movement_logging(self):
        """Test stock movement tracking"""
        movement = StockMovement.objects.create(
            product=self.product,
            movement_type='in',
            quantity=50,
            notes='Restocking'
        )
        
        assert movement.product == self.product
        assert movement.quantity == 50


@pytest.mark.django_db
class TestFavorites(TestCase):
    """Test Favorite/Wishlist functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            phone_number="9876543210",
            password="testpass123"
        )
        
        self.category = Category.objects.create(name="Vitamins")
        self.product = Product.objects.create(
            name="Vitamin D",
            category=self.category,
            price=Decimal("200"),
            stock=50
        )
    
    def test_add_to_favorites(self):
        """Test adding product to favorites"""
        favorite = Favorite.objects.create(user=self.user, product=self.product)
        assert favorite.user == self.user
        assert favorite.product == self.product
    
    def test_duplicate_favorite(self):
        """Test that duplicate favorites are not allowed"""
        Favorite.objects.create(user=self.user, product=self.product)
        
        with pytest.raises(Exception):  # unique_together constraint
            Favorite.objects.create(user=self.user, product=self.product)
    
    def test_user_favorites_list(self):
        """Test retrieving user's favorites"""
        Favorite.objects.create(user=self.user, product=self.product)
        
        favorites = self.user.favorites.all()
        assert favorites.count() == 1
        assert favorites.first().product == self.product


@pytest.mark.django_db
class TestDrugInteractions(TestCase):
    """Test Drug Interaction checking"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Medicines")
        self.drug1 = Product.objects.create(
            name="Aspirin",
            category=self.category,
            price=Decimal("50"),
            stock=100
        )
        self.drug2 = Product.objects.create(
            name="Warfarin",
            category=self.category,
            price=Decimal("200"),
            stock=50
        )
        
        self.interaction = DrugInteraction.objects.create(
            drug1=self.drug1,
            drug2=self.drug2,
            description="Increased bleeding risk",
            severity="severe",
            recommendation="Monitor closely or use alternative"
        )
    
    def test_interaction_creation(self):
        """Test drug interaction record creation"""
        assert self.interaction.severity == "severe"
        assert "bleeding" in self.interaction.description.lower()
    
    def test_check_interactions(self):
        """Test checking interactions between products"""
        products = [self.drug1, self.drug2]
        interactions = DrugInteraction.check_interactions(products)
        
        assert len(interactions) == 1
        assert interactions[0].severity == "severe"
    
    def test_no_interactions(self):
        """Test when no interactions exist"""
        drug3 = Product.objects.create(
            name="Vitamin D",
            category=self.category,
            price=Decimal("100"),
            stock=200
        )
        
        products = [self.drug1, drug3]
        interactions = DrugInteraction.check_interactions(products)
        assert len(interactions) == 0


@pytest.mark.django_db
class TestDeliverySlot(TestCase):
    """Test Delivery Slot functionality"""
    
    def setUp(self):
        from datetime import time
        self.slot = DeliverySlot.objects.create(
            start_time=time(9, 0),
            end_time=time(12, 0),
            capacity=10,
            current_bookings=0
        )
    
    def test_slot_creation(self):
        """Test delivery slot creation"""
        assert self.slot.available_capacity == 10
        assert self.slot.is_full is False
    
    def test_slot_full(self):
        """Test when slot reaches capacity"""
        self.slot.current_bookings = 10
        self.slot.save()
        
        assert self.slot.is_full is True
        assert self.slot.available_capacity == 0
    
    def test_can_book(self):
        """Test slot booking availability"""
        assert self.slot.can_book() is True
        
        self.slot.is_active = False
        self.slot.save()
        assert self.slot.can_book() is False


@pytest.mark.django_db
class TestNotification(TestCase):
    """Test Notification system"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com",
            phone_number="9876543210",
            password="pass123"
        )
    
    def test_notification_creation(self):
        """Test creating a notification"""
        notification = Notification.objects.create(
            user=self.user,
            notification_type='order_status',
            title='Order Confirmed',
            message='Your order has been confirmed'
        )
        
        assert notification.is_read is False
        assert notification.user == self.user
    
    def test_mark_as_read(self):
        """Test marking notification as read"""
        notification = Notification.objects.create(
            user=self.user,
            notification_type='promotion',
            title='Special Offer',
            message='Get 20% off on all vitamins'
        )
        
        notification.mark_as_read()
        assert notification.is_read is True
        assert notification.read_at is not None
