from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from datetime import timedelta

class Category(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    AVAILABILITY_CHOICES = (
        ('in_stock', 'In Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('discontinued', 'Discontinued'),
    )
    
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    stock_quantity = models.IntegerField(default=0)  # Alternative field name
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    requires_prescription = models.BooleanField(default=False)
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='in_stock')
    manufacturer = models.CharField(max_length=200, blank=True, null=True)
    strength = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., 500mg, 10ml")
    form = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., Tablet, Capsule, Syrup")
    
    # Batch & Expiry Tracking
    batch_number = models.CharField(max_length=100, blank=True, null=True, help_text="Product batch/lot number")
    expiry_date = models.DateField(blank=True, null=True, help_text="Product expiry date")
    
    # Medical Information for 1mg-style features
    salt_composition = models.CharField(max_length=500, blank=True, null=True, help_text="e.g., Paracetamol (500mg)")
    side_effects = models.TextField(blank=True, null=True)
    expert_tips = models.TextField(blank=True, null=True)
    how_to_use = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    @property
    def is_available(self):
        return self.stock > 0 and self.availability_status == 'in_stock'
    
    @property
    def is_expired(self):
        """Check if product is expired"""
        if not self.expiry_date:
            return False
        return timezone.now().date() > self.expiry_date
    
    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if not reviews:
            return 0
        return sum(r.rating for r in reviews) / reviews.count()


# ============= PRODUCT VARIANTS =============
class ProductVariant(models.Model):
    """Product variants like different pack sizes (e.g., 10 tabs vs 30 tabs)"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    variant_name = models.CharField(max_length=100, help_text="e.g., 10 Tablets, 30 Tablets")
    quantity = models.IntegerField(help_text="Quantity in this variant")
    unit = models.CharField(max_length=50, default='tablets', help_text="e.g., tablets, ml, grams")
    additional_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Additional price on top of product price")
    stock = models.IntegerField(default=0)
    sku = models.CharField(max_length=100, blank=True, null=True, unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'variant_name')
        ordering = ['quantity']

    def __str__(self):
        return f"{self.product.name} - {self.variant_name}"

    @property
    def total_price(self):
        """Total price with variant additional cost"""
        return self.product.price + self.additional_price

    @property
    def is_available(self):
        return self.stock > 0 and self.product.availability_status == 'in_stock'



class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}/5)"
    
    class Meta:
        unique_together = ('product', 'user')


# ============= DISCOUNT/COUPON SYSTEM =============
class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )
    
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Constraints
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    min_purchase = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])  # Alias
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    max_uses = models.IntegerField(null=True, blank=True, help_text="Leave blank for unlimited uses")
    max_uses_per_user = models.IntegerField(default=1)
    
    # Applicability
    applicable_to_products = models.ManyToManyField(Product, blank=True, help_text="Leave empty to apply to all products")
    applicable_products = models.ManyToManyField(Product, blank=True, related_name='discount_applicable_to')  # Alias
    applicable_to_categories = models.ManyToManyField(Category, blank=True, help_text="Leave empty to apply to all categories")
    applicable_categories = models.ManyToManyField(Category, blank=True, related_name='discount_applicable_to')  # Alias
    excluded_products = models.ManyToManyField(Product, blank=True, related_name='discount_excluded_from')
    
    # Validity
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    valid_to = models.DateTimeField(null=True, blank=True)  # Alias
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    times_used = models.IntegerField(default=0)
    current_uses = models.IntegerField(default=0)  # Alias
    total_discount_given = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.discount_value} {self.get_discount_type_display()}"

    @property
    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.valid_from or now > self.valid_until:
            return False
        if self.max_uses and self.times_used >= self.max_uses:
            return False
        return True

    def calculate_discount(self, cart_total):
        """Calculate discount amount for given cart total"""
        if self.discount_type == 'percentage':
            discount = cart_total * (self.discount_value / 100)
        else:
            discount = self.discount_value
        
        if self.max_discount_amount:
            discount = min(discount, self.max_discount_amount)
        
        return min(discount, cart_total)

    class Meta:
        ordering = ['-created_at']


# Create alias for backward compatibility
Discount = Coupon


class CouponUsage(models.Model):
    """Track coupon usage per user"""
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usage_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('coupon', 'user', 'order')


# ============= STOCK MANAGEMENT =============
class ProductStock(models.Model):
    """Track product stock with batch/lot details"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='stock_info')
    
    # Stock tracking
    total_stock = models.IntegerField(default=0)
    reserved_stock = models.IntegerField(default=0)  # Items in pending orders
    available_stock = models.IntegerField(default=0)
    
    # Batch/Lot tracking
    last_restocked = models.DateTimeField(null=True, blank=True)
    low_stock_threshold = models.IntegerField(default=10)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name} - Available: {self.available_stock}, Reserved: {self.reserved_stock}"

    @property
    def is_low_stock(self):
        return self.available_stock <= self.low_stock_threshold

    def reserve_stock(self, quantity):
        """Reserve stock for an order"""
        if quantity > self.available_stock:
            raise ValidationError(f"Insufficient stock. Available: {self.available_stock}")
        self.reserved_stock += quantity
        self.available_stock -= quantity
        self.save()

    def release_reserved_stock(self, quantity):
        """Release reserved stock (order cancelled/returned)"""
        self.reserved_stock = max(0, self.reserved_stock - quantity)
        self.available_stock += quantity
        self.save()

    def confirm_reservation(self, quantity):
        """Confirm reserved stock as sold"""
        self.reserved_stock = max(0, self.reserved_stock - quantity)
        self.save()


class StockMovement(models.Model):
    """Log all stock movements for audit"""
    MOVEMENT_TYPE_CHOICES = (
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('reserve', 'Reserved'),
        ('release', 'Released'),
        ('adjustment', 'Adjustment'),
        ('return', 'Return'),
    )
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.IntegerField()
    notes = models.TextField(blank=True, null=True)
    
    # Reference to related objects
    order = models.ForeignKey('orders.Order', null=True, blank=True, on_delete=models.SET_NULL)
    
    moved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-moved_at']

    def __str__(self):
        return f"{self.product.name} - {self.get_movement_type_display()} ({self.quantity})"


# ============= FAVORITES/WISHLIST =============
class Favorite(models.Model):
    """User's favorite/wishlist products"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username} favorited {self.product.name}"


# ============= DRUG INTERACTIONS =============
class DrugInteraction(models.Model):
    """Database of drug-drug interactions"""
    SEVERITY_CHOICES = (
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    )
    
    drug1 = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='interactions_as_drug1')
    drug2 = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='interactions_as_drug2')
    
    description = models.TextField(help_text="Description of the interaction")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    recommendation = models.TextField(help_text="Recommended action or precaution")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('drug1', 'drug2')

    def __str__(self):
        return f"{self.drug1.name} + {self.drug2.name} ({self.get_severity_display()})"

    @classmethod
    def check_interactions(cls, products):
        """Check for interactions between multiple products"""
        interactions = []
        for i, product1 in enumerate(products):
            for product2 in products[i+1:]:
                interaction = cls.objects.filter(
                    (models.Q(drug1=product1, drug2=product2)) |
                    (models.Q(drug1=product2, drug2=product1))
                ).first()
                if interaction:
                    interactions.append(interaction)
        return interactions


# ============= DELIVERY SLOTS =============
class DeliverySlot(models.Model):
    """Available delivery time slots"""
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.IntegerField(help_text="Number of deliveries in this slot")
    current_bookings = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')} (Available: {self.available_capacity})"

    @property
    def available_capacity(self):
        return self.capacity - self.current_bookings

    @property
    def is_full(self):
        return self.current_bookings >= self.capacity

    def can_book(self):
        return self.is_active and not self.is_full


# ============= NOTIFICATIONS =============
class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ('order_status', 'Order Status'),
        ('prescription_verified', 'Prescription Verified'),
        ('delivery', 'Delivery Update'),
        ('promotion', 'Promotion'),
        ('reminder', 'Reminder'),
        ('alert', 'Alert'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Content linking
    order = models.ForeignKey('orders.Order', null=True, blank=True, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.CASCADE)
    
    # Status tracking
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Channels
    email_sent = models.BooleanField(default=False)
    push_sent = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} - {self.title}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


