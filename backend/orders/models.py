from django.db import models
from django.conf import settings
from django.utils import timezone
from products.models import Product
from datetime import timedelta

class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

class Order(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
        ('Return', 'Return'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('cod', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('razorpay', 'Razorpay'),
        ('stripe', 'Stripe'),
        ('upi', 'UPI'),
        ('wallet', 'Wallet'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    address = models.ForeignKey('users.Address', on_delete=models.SET_NULL, null=True)
    
    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon = models.ForeignKey('products.Coupon', on_delete=models.SET_NULL, null=True, blank=True)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status tracking
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cod')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Payment Gateway IDs
    stripe_payment_intent_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_order_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=255, null=True, blank=True)
    
    # Delivery Info
    delivery_slot = models.ForeignKey('products.DeliverySlot', on_delete=models.SET_NULL, null=True, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.user.email}"

    def calculate_total(self):
        """Recalculate order total"""
        self.subtotal = sum(item.price * item.quantity for item in self.items.all())
        self.total_price = self.subtotal - self.discount_amount + self.tax_amount + self.shipping_charge
        self.save()
        return self.total_price

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

class Prescription(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending Review'),
        ('Verified', 'Verified'),
        ('Rejected', 'Rejected'),
        ('Expired', 'Expired'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions')
    image = models.ImageField(upload_to='prescriptions/')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    is_verified = models.BooleanField(default=False)
    
    # Advanced clinical logic
    expiry_date = models.DateField(null=True, blank=True)
    is_recurring = models.BooleanField(default=False, help_text="Set if this prescription is for chronic/recurring needs")
    doctor_name = models.CharField(max_length=255, null=True, blank=True)
    digital_signature = models.CharField(max_length=255, null=True, blank=True)
    
    # Internal management
    assigned_pharmacist = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='verified_prescriptions'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_valid(self):
        if self.expiry_date and self.expiry_date < timezone.now().date():
            return False
        return self.is_verified


# ============= ORDER CANCELLATION =============
class OrderCancellationRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    
    REASON_CHOICES = (
        ('change_mind', 'Changed My Mind'),
        ('better_price', 'Found Better Price'),
        ('shipping_time', 'Shipping Takes Too Long'),
        ('out_of_stock', 'Out of Stock'),
        ('found_alternative', 'Found Alternative'),
        ('other', 'Other'),
    )
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='cancellation_request')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    comments = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timeline
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Processing
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_cancellations')
    admin_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Cancellation Request for Order #{self.order.id}"

    @property
    def can_cancel(self):
        """Check if order can still be cancelled"""
        # Can't cancel if already shipped
        if self.order.status in ['Shipped', 'Delivered', 'Cancelled']:
            return False
        # Can only cancel within 30 minutes of order creation
        time_diff = timezone.now() - self.order.created_at
        return time_diff < timedelta(minutes=30)


class Refund(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='refund')
    cancellation_request = models.OneToOneField(OrderCancellationRequest, on_delete=models.CASCADE, related_name='refund', null=True, blank=True)
    
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    refund_method = models.CharField(max_length=50)  # e.g., 'original_payment', 'wallet'
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    transaction_id = models.CharField(max_length=255, null=True, blank=True)
    refund_notes = models.TextField(blank=True, null=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Refund for Order #{self.order.id} - {self.refund_amount}"


# ============= DELIVERY MANAGEMENT =============
class OrderDelivery(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed Delivery'),
    )
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    delivery_slot = models.ForeignKey('products.DeliverySlot', on_delete=models.SET_NULL, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    estimated_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    delivery_partner = models.CharField(max_length=255, null=True, blank=True)
    tracking_number = models.CharField(max_length=255, null=True, blank=True)
    
    delivery_attempts = models.IntegerField(default=0)
    last_delivery_attempt = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Delivery for Order #{self.order.id} - {self.status}"

    @property
    def is_overdue(self):
        return timezone.now().date() > self.estimated_delivery_date and self.status != 'delivered'

