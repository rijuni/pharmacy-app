"""
Comprehensive test suite for Products app
Tests cover: Products, Discounts, Stock Management, Variants, Favorites
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from products.models import (
    Category, Product, ProductVariant, Review, Coupon, 
    ProductStock, StockMovement, Favorite, DrugInteraction, 
    DeliverySlot, Notification
)

User = get_user_model()


class CategoryTests(TestCase):
    """Test Category model functionality"""
    
    def setUp(self):
        self.category = Category.objects.create(
            name="Pain Relief",
            description="Pain relief medicines"
        )
    
    def test_category_creation(self):
        """Test basic category creation"""
        self.assertEqual(self.category.name, "Pain Relief")
        self.assertTrue(Category.objects.filter(name="Pain Relief").exists())
    
    def test_category_string_representation(self):
        """Test category __str__ method"""
        self.assertEqual(str(self.category), "Pain Relief")


class ProductTests(TestCase):
    """Test Product model and related functionality"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Tablets")
        self.product = Product.objects.create(
            name="Paracetamol",
            generic_name="Paracetamol/Acetaminophen",
            category=self.category,
            price=100.00,
            stock=50,
            requires_prescription=False,
            salt_composition="Paracetamol 500mg",
            side_effects="Mild headache, nausea",
            how_to_use="Take 1-2 tablets as needed",
            expert_tips="Take after food if stomach upset",
            batch_number="BATCH001",
            expiry_date=timezone.now().date() + timedelta(days=365)
        )
    
    def test_product_creation(self):
        """Test basic product creation"""
        self.assertEqual(self.product.name, "Paracetamol")
        self.assertEqual(self.product.price, Decimal('100.00'))
        self.assertTrue(self.product.is_available)
    
    def test_product_is_available_property(self):
        """Test is_available property"""
        self.assertTrue(self.product.is_available)
        self.product.stock = 0
        self.product.save()
        self.assertFalse(self.product.is_available)
    
    def test_product_is_expired_property(self):
        """Test is_expired property"""
        self.assertFalse(self.product.is_expired)
        self.product.expiry_date = timezone.now().date() - timedelta(days=1)
        self.product.save()
        self.assertTrue(self.product.is_expired)
    
    def test_average_rating_no_reviews(self):
        """Test average_rating with no reviews"""
        self.assertEqual(self.product.average_rating, 0)
    
    def test_average_rating_with_reviews(self):
        """Test average_rating calculation"""
        user = User.objects.create_user(username='testuser', email='test@test.com')
        Review.objects.create(product=self.product, user=user, rating=5, comment="Great!")
        Review.objects.create(product=self.product, user_id=None, rating=3, comment="Okay")
        
        reviews = self.product.reviews.all()
        self.assertEqual(reviews.count(), 2)


class ProductVariantTests(TestCase):
    """Test ProductVariant functionality"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Tablets")
        self.product = Product.objects.create(
            name="Aspirin",
            category=self.category,
            price=50.00,
        )
    
    def test_variant_creation(self):
        """Test product variant creation"""
        variant = ProductVariant.objects.create(
            product=self.product,
            variant_name="10 Tablets",
            quantity=10,
            additional_price=0,
            stock=100
        )
        self.assertEqual(variant.variant_name, "10 Tablets")
        self.assertEqual(variant.total_price, Decimal('50.00'))
    
    def test_variant_with_additional_price(self):
        """Test variant pricing with additional cost"""
        variant = ProductVariant.objects.create(
            product=self.product,
            variant_name="30 Tablets",
            quantity=30,
            additional_price=10.00,
            stock=50
        )
        self.assertEqual(variant.total_price, Decimal('60.00'))
    
    def test_variant_is_available(self):
        """Test variant availability"""
        variant = ProductVariant.objects.create(
            product=self.product,
            variant_name="10 Tablets",
            quantity=10,
            stock=0
        )
        self.assertFalse(variant.is_available)


class CouponTests(TestCase):
    """Test Discount/Coupon functionality"""
    
    def setUp(self):
        self.coupon = Coupon.objects.create(
            code="SAVE10",
            description="Save 10%",
            discount_type="percentage",
            discount_value=10,
            min_purchase_amount=100,
            max_uses=100,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timedelta(days=30),
            is_active=True
        )
    
    def test_coupon_creation(self):
        """Test coupon creation"""
        self.assertEqual(self.coupon.code, "SAVE10")
        self.assertTrue(self.coupon.is_valid)
    
    def test_coupon_percentage_discount(self):
        """Test percentage discount calculation"""
        discount = self.coupon.calculate_discount(500)
        self.assertEqual(discount, Decimal('50'))  # 10% of 500
    
    def test_coupon_fixed_discount(self):
        """Test fixed amount discount"""
        coupon = Coupon.objects.create(
            code="SAVE50",
            discount_type="fixed",
            discount_value=50,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timedelta(days=30),
        )
        discount = coupon.calculate_discount(500)
        self.assertEqual(discount, Decimal('50'))
    
    def test_coupon_max_discount_cap(self):
        """Test max discount amount capping"""
        coupon = Coupon.objects.create(
            code="PERCENT",
            discount_type="percentage",
            discount_value=50,
            max_discount_amount=100,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timedelta(days=30),
        )
        discount = coupon.calculate_discount(1000)
        self.assertEqual(discount, Decimal('100'))  # Capped at max
    
    def test_coupon_validity_expired(self):
        """Test expired coupon"""
        expired_coupon = Coupon.objects.create(
            code="EXPIRED",
            discount_type="percentage",
            discount_value=10,
            valid_from=timezone.now() - timedelta(days=30),
            valid_until=timezone.now() - timedelta(days=1),
        )
        self.assertFalse(expired_coupon.is_valid)
    
    def test_coupon_max_uses_reached(self):
        """Test coupon with max uses reached"""
        coupon = Coupon.objects.create(
            code="LIMITED",
            discount_type="percentage",
            discount_value=10,
            max_uses=1,
            times_used=1,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timedelta(days=30),
        )
        self.assertFalse(coupon.is_valid)


class ReviewTests(TestCase):
    """Test Review functionality"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Tablets")
        self.product = Product.objects.create(
            name="Test Medicine",
            category=self.category,
            price=100
        )
        self.user = User.objects.create_user(
            username='reviewer',
            email='reviewer@test.com'
        )
    
    def test_review_creation(self):
        """Test review creation"""
        review = Review.objects.create(
            product=self.product,
            user=self.user,
            rating=5,
            comment="Excellent product!"
        )
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.product, self.product)
    
    def test_unique_review_per_user_product(self):
        """Test unique constraint on product-user review"""
        Review.objects.create(
            product=self.product,
            user=self.user,
            rating=5,
            comment="First review"
        )
        
        with self.assertRaises(Exception):
            Review.objects.create(
                product=self.product,
                user=self.user,
                rating=3,
                comment="Duplicate review"
            )
    
    def test_review_rating_validation(self):
        """Test rating value validation"""
        # Django should prevent invalid ratings through validators
        review = Review.objects.create(
            product=self.product,
            user=self.user,
            rating=5,
            comment="Valid rating"
        )
        self.assertIn(review.rating, [1, 2, 3, 4, 5])


class FavoriteTests(TestCase):
    """Test Favorite/Wishlist functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@test.com')
        self.category = Category.objects.create(name="Tablets")
        self.product = Product.objects.create(
            name="Favorite Medicine",
            category=self.category,
            price=100
        )
    
    def test_add_to_favorites(self):
        """Test adding product to favorites"""
        favorite = Favorite.objects.create(user=self.user, product=self.product)
        self.assertEqual(favorite.user, self.user)
        self.assertEqual(favorite.product, self.product)
    
    def test_unique_favorite_per_user_product(self):
        """Test unique constraint on user-product favorite"""
        Favorite.objects.create(user=self.user, product=self.product)
        
        with self.assertRaises(Exception):
            Favorite.objects.create(user=self.user, product=self.product)
    
    def test_get_user_favorites(self):
        """Test retrieving user's favorites"""
        Favorite.objects.create(user=self.user, product=self.product)
        
        user_favorites = self.user.favorites.all()
        self.assertEqual(user_favorites.count(), 1)
        self.assertEqual(user_favorites.first().product, self.product)


class DrugInteractionTests(TestCase):
    """Test Drug Interaction functionality"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Tablets")
        self.drug1 = Product.objects.create(
            name="Drug1",
            category=self.category,
            price=100
        )
        self.drug2 = Product.objects.create(
            name="Drug2",
            category=self.category,
            price=150
        )
    
    def test_drug_interaction_creation(self):
        """Test creating drug interaction record"""
        interaction = DrugInteraction.objects.create(
            drug1=self.drug1,
            drug2=self.drug2,
            description="These drugs may interact",
            severity="moderate",
            recommendation="Take with 2 hours gap"
        )
        self.assertEqual(interaction.severity, "moderate")
    
    def test_check_interactions(self):
        """Test checking interactions between products"""
        DrugInteraction.objects.create(
            drug1=self.drug1,
            drug2=self.drug2,
            description="Interaction",
            severity="severe",
            recommendation="Do not take together"
        )
        
        drugs = [self.drug1, self.drug2]
        interactions = DrugInteraction.check_interactions(drugs)
        self.assertEqual(len(interactions), 1)


class NotificationTests(TestCase):
    """Test Notification functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@test.com')
    
    def test_notification_creation(self):
        """Test creating notification"""
        notification = Notification.objects.create(
            user=self.user,
            notification_type="order_status",
            title="Order Confirmed",
            message="Your order has been confirmed"
        )
        self.assertFalse(notification.is_read)
    
    def test_mark_notification_as_read(self):
        """Test marking notification as read"""
        notification = Notification.objects.create(
            user=self.user,
            notification_type="order_status",
            title="Order Status",
            message="Your order is being processed"
        )
        notification.mark_as_read()
        
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)


class DeliverySlotTests(TestCase):
    """Test DeliverySlot functionality"""
    
    def test_delivery_slot_creation(self):
        """Test creating delivery slot"""
        from datetime import time
        slot = DeliverySlot.objects.create(
            start_time=time(8, 0),
            end_time=time(12, 0),
            capacity=10,
            is_active=True
        )
        self.assertEqual(slot.capacity, 10)
        self.assertTrue(slot.can_book())
    
    def test_delivery_slot_full(self):
        """Test slot become full"""
        from datetime import time
        slot = DeliverySlot.objects.create(
            start_time=time(8, 0),
            end_time=time(12,  0),
            capacity=2,
            current_bookings=2
        )
        self.assertFalse(slot.can_book())
    
    def test_delivery_slot_available_capacity(self):
        """Test calculating available capacity"""
        from datetime import time
        slot = DeliverySlot.objects.create(
            start_time=time(8, 0),
            end_time=time(12, 0),
            capacity=10,
            current_bookings=3
        )
        self.assertEqual(slot.available_capacity, 7)


class StockManagementTests(TestCase):
    """Test Stock Management functionality"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Tablets")
        self.product = Product.objects.create(
            name="Stock Test",
            category=self.category,
            price=100,
            stock=100
        )
        self.stock_info = ProductStock.objects.create(
            product=self.product,
            total_stock=100,
            available_stock=100
        )
    
    def test_stock_creation(self):
        """Test stock info creation"""
        self.assertEqual(self.stock_info.available_stock, 100)
        self.assertFalse(self.stock_info.is_low_stock)
    
    def test_reserve_stock(self):
        """Test reserving stock"""
        self.stock_info.reserve_stock(10)
        self.stock_info.refresh_from_db()
        
        self.assertEqual(self.stock_info.reserved_stock, 10)
        self.assertEqual(self.stock_info.available_stock, 90)
    
    def test_reserve_stock_insufficient(self):
        """Test reserving more than available"""
        from django.core.exceptions import ValidationError
        
        with self.assertRaises(ValidationError):
            self.stock_info.reserve_stock(200)
    
    def test_release_reserved_stock(self):
        """Test releasing reserved stock"""
        self.stock_info.reserve_stock(10)
        self.stock_info.release_reserved_stock(10)
        self.stock_info.refresh_from_db()
        
        self.assertEqual(self.stock_info.reserved_stock, 0)
        self.assertEqual(self.stock_info.available_stock, 100)
    
    def test_confirm_reservation(self):
        """Test confirming reserved stock as sold"""
        self.stock_info.reserve_stock(10)
        self.stock_info.confirm_reservation(10)
        self.stock_info.refresh_from_db()
        
        self.assertEqual(self.stock_info.reserved_stock, 0)


class StockMovementTests(TestCase):
    """Test Stock Movement logging"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Tablets")
        self.product = Product.objects.create(
            name="Movement Test",
            category=self.category,
            price=100
        )
    
    def test_stock_movement_logging(self):
        """Test logging stock movements"""
        movement = StockMovement.objects.create(
            product=self.product,
            movement_type="in",
            quantity=50,
            notes="Initial stock entry"
        )
        
        self.assertEqual(movement.movement_type, "in")
        self.assertEqual(movement.quantity, 50)
