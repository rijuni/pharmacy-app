"""
Utility helpers for products and orders apps
Includes: discount calculations, validators, notifications
"""

from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


# ============= DISCOUNT & COUPON UTILITIES =============

class CouponValidator:
    """Validate and apply coupons to orders"""
    
    @staticmethod
    def is_coupon_applicable(coupon, cart_items, user):
        """Check if coupon can be applied to items"""
        if not coupon.is_valid:
            raise ValidationError("This coupon is no longer valid")
        
        # Check minimum purchase
        cart_total = sum(item['price'] * item['quantity'] for item in cart_items)
        if cart_total < coupon.min_purchase_amount:
            raise ValidationError(
                f"Minimum purchase amount is {coupon.min_purchase_amount}"
            )
        
        # Check user usage limit
        from products.models import CouponUsage
        user_usage_count = CouponUsage.objects.filter(
            coupon=coupon,
            user=user
        ).count()
        
        if user_usage_count >= coupon.max_uses_per_user:
            raise ValidationError("You have already used this coupon")
        
        return True
    
    @staticmethod
    def apply_coupon(coupon, cart_total):
        """Apply coupon and return discount amount"""
        try:
            CouponValidator.is_coupon_applicable(coupon, [{'price': cart_total}], None)
            discount = coupon.calculate_discount(cart_total)
            return discount
        except ValidationError as e:
            logger.warning(f"Invalid coupon application: {str(e)}")
            raise


# ============= PRESCRIPTION VALIDATORS =============

class PrescriptionValidator:
    """Validate prescriptions"""
    
    @staticmethod
    def is_prescription_valid(prescription):
        """Check if prescription is valid for use"""
        if not prescription.is_verified:
            raise ValidationError("Prescription has not been verified by pharmacist")
        
        if prescription.expiry_date and prescription.expiry_date < timezone.now().date():
            raise ValidationError("Prescription has expired")
        
        return True
    
    @staticmethod
    def can_use_prescription_for_order(prescription, products):
        """Check if prescription can be used for given products"""
        rx_required_products = [p for p in products if p.requires_prescription]
        
        if rx_required_products and not prescription.is_verified:
            raise ValidationError(
                "One or more products require verified prescription"
            )
        
        return True


# ============= PRODUCT VALIDATORS =============

class ProductValidator:
    """Validate product availability and eligibility"""
    
    @staticmethod
    def is_product_available(product, quantity=1):
        """Check if product is available in requested quantity"""
        if product.is_expired:
            raise ValidationError(f"{product.name} has expired")
        
        if not product.is_available:
            raise ValidationError(f"{product.name} is out of stock")
        
        if product.stock < quantity:
            raise ValidationError(
                f"Only {product.stock} units available"
            )
        
        return True
    
    @staticmethod
    def validate_batch_expiry(product):
        """Validate product batch and expiry"""
        if not product.batch_number:
            logger.warning(f"Product {product.id} has no batch number")
        
        if product.expiry_date and product.is_expired:
            logger.error(f"Product {product.id} has expired")
            raise ValidationError("Product has expired")


# ============= ORDER VALIDATORS =============

class OrderValidator:
    """Validate orders and cart items"""
    
    @staticmethod
    def validate_order_items(cart_items):
        """Validate all items in cart"""
        if not cart_items:
            raise ValidationError("Cart is empty")
        
        for item in cart_items:
            try:
                ProductValidator.is_product_available(
                    item['product'],
                    item['quantity']
                )
            except ValidationError as e:
                raise ValidationError(f"Item validation failed: {str(e)}")
        
        return True
    
    @staticmethod
    def validate_delivery_address(address):
        """Validate delivery address"""
        if not address:
            raise ValidationError("Delivery address is required")
        
        required_fields = ['street', 'city', 'state', 'zip_code', 'country']
        for field in required_fields:
            if not getattr(address, field, None):
                raise ValidationError(f"Address {field} is required")
        
        return True


# ============= NOTIFICATION HELPERS =============

class NotificationHelper:
    """Handle notifications across channels"""
    
    @staticmethod
    def send_order_confirmation(order):
        """Send order confirmation notification"""
        try:
            subject = f"Order Confirmation - #{order.id}"
            message = f"""
            Your order #{order.id} has been confirmed!
            Total: ₹{order.total_price}
            Status: {order.status}
            
            Thank you for shopping with us.
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [order.user.email],
                fail_silently=False
            )
            logger.info(f"Order confirmation sent for Order #{order.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send order confirmation: {str(e)}")
            return False
    
    @staticmethod
    def send_prescription_status(prescription, status):
        """Send prescription status update"""
        try:
            status_messages = {
                'Verified': 'Your prescription has been verified',
                'Rejected': 'Your prescription was rejected by pharmacist',
                'Expired': 'Your prescription has expired'
            }
            
            message = status_messages.get(status, 'Prescription status updated')
            
            send_mail(
                f"Prescription {status}",
                message,
                settings.DEFAULT_FROM_EMAIL,
                [prescription.user.email],
                fail_silently=False
            )
            logger.info(f"Prescription status notification sent for Rx #{prescription.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send prescription notification: {str(e)}")
            return False
    
    @staticmethod
    def send_delivery_update(order, status):
        """Send delivery status update"""
        try:
            status_messages = {
                'pending': 'Your order is pending preparation',
                'assigned': 'Your order has been assigned to delivery partner',
                'in_transit': 'Your order is on the way',
                'delivered': 'Your order has been delivered',
                'failed': 'Delivery attempt failed, will retry'
            }
            
            message = status_messages.get(status, 'Delivery status updated')
            
            send_mail(
                f"Delivery Update - Order #{order.id}",
                message,
                settings.DEFAULT_FROM_EMAIL,
                [order.user.email],
                fail_silently=False
            )
            logger.info(f"Delivery update sent for Order #{order.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send delivery update: {str(e)}")
            return False


# ============= STOCK MANAGEMENT HELPERS =============

class StockManager:
    """Manage product stock operations"""
    
    @staticmethod
    def check_and_reserve_stock(product, quantity):
        """Check and reserve stock for order"""
        try:
            from products.models import ProductStock
            
            stock_info = ProductStock.objects.get(product=product)
            if stock_info.available_stock < quantity:
                raise ValidationError(
                    f"Insufficient stock. Available: {stock_info.available_stock}"
                )
            
            stock_info.reserve_stock(quantity)
            logger.info(f"Stocks reserved for Product {product.id}: {quantity} units")
            return True
        except ProductStock.DoesNotExist:
            logger.error(f"Stock info not found for Product {product.id}")
            raise ValidationError("Stock information not available")
    
    @staticmethod
    def release_reserved_stock(product, quantity, reason="order_cancelled"):
        """Release reserved stock"""
        try:
            from products.models import ProductStock, StockMovement
            
            stock_info = ProductStock.objects.get(product=product)
            stock_info.release_reserved_stock(quantity)
            
            StockMovement.objects.create(
                product=product,
                movement_type='release',
                quantity=quantity,
                notes=f"Released due to {reason}"
            )
            
            logger.info(f"Stock released for Product {product.id}: {quantity} units")
            return True
        except ProductStock.DoesNotExist:
            logger.error(f"Stock info not found for Product {product.id}")
            return False


# ============= DRUG INTERACTION CHECKER =============

class DrugInteractionChecker:
    """Check for drug interactions"""
    
    @staticmethod
    def check_interactions(products):
        """Check for interactions between products"""
        from products.models import DrugInteraction
        
        interactions = DrugInteraction.check_interactions(products)
        
        if interactions:
            high_severity = [i for i in interactions if i.severity == 'severe']
            if high_severity:
                logger.warning(f"Severe drug interactions detected: {len(high_severity)}")
                raise ValidationError(
                    "Warning: Severe interactions detected. Please consult pharmacist."
                )
            
            logger.info(f"Drug interactions found: {len(interactions)}")
        
        return interactions
    
    @staticmethod
    def get_interaction_warnings(products):
        """Get interaction warnings without raising error"""
        from products.models import DrugInteraction
        
        interactions = DrugInteraction.check_interactions(products)
        
        warnings = []
        for interaction in interactions:
            warnings.append({
                'drugs': f"{interaction.drug1.name} + {interaction.drug2.name}",
                'severity': interaction.severity,
                'description': interaction.description,
                'recommendation': interaction.recommendation
            })
        
        return warnings


# ============= DELIVERY SLOT HELPERS =============

class DeliverySlotManager:
    """Manage delivery slots"""
    
    @staticmethod
    def get_available_slots(date=None):
        """Get available delivery slots for a date"""
        from products.models import DeliverySlot
        
        if date is None:
            date = timezone.now().date()
        
        available_slots = DeliverySlot.objects.filter(
            is_active=True
        ).exclude(current_bookings__gte=timezone.models.F('capacity'))
        
        return available_slots
    
    @staticmethod
    def book_slot(slot, order):
        """Book a delivery slot"""
        if not slot.can_book():
            raise ValidationError("This slot is fully booked")
        
        slot.current_bookings += 1
        slot.save()
        
        logger.info(f"Slot booked for Order #{order.id}")
        return True
    
    @staticmethod
    def release_slot(slot, order):
        """Release a booked slot"""
        if slot.current_bookings > 0:
            slot.current_bookings -= 1
            slot.save()
            logger.info(f"Slot released for Order #{order.id}")


# ============= TAX & PRICING HELPERS =============

class PricingHelper:
    """Calculate taxes, discounts, and final pricing"""
    
    @staticmethod
    def calculate_tax(subtotal, tax_rate=0.05):
        """Calculate tax on subtotal"""
        return Decimal(subtotal) * Decimal(tax_rate)
    
    @staticmethod
    def calculate_shipping(subtotal, free_shipping_threshold=500):
        """Calculate shipping charge"""
        if subtotal >= free_shipping_threshold:
            return Decimal(0)
        return Decimal(50)  # Default shipping
    
    @staticmethod
    def calculate_final_price(subtotal, discount=0, tax=0, shipping=0):
        """Calculate final order price"""
        return Decimal(subtotal) - Decimal(discount) + Decimal(tax) + Decimal(shipping)


# ============= LOGGING UTILITIES =============

class OrderLogger:
    """Log order-related events"""
    
    @staticmethod
    def log_order_created(order):
        """Log order creation"""
        logger.info(
            f"Order created: #{order.id} | User: {order.user.email} | "
            f"Total: ₹{order.total_price}"
        )
    
    @staticmethod
    def log_order_status_change(order, old_status, new_status):
        """Log order status change"""
        logger.info(
            f"Order #{order.id} status changed: {old_status} → {new_status}"
        )
    
    @staticmethod
    def log_cancellation_request(cancellation):
        """Log cancellation request"""
        logger.info(
            f"Cancellation request: Order #{cancellation.order.id} | "
            f"Reason: {cancellation.reason}"
        )
    
    @staticmethod
    def log_refund_processed(refund):
        """Log refund processing"""
        logger.info(
            f"Refund processed: Order #{refund.order.id} | "
            f"Amount: ₹{refund.refund_amount} | Status: {refund.status}"
        )
