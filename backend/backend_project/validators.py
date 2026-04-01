"""
Validators for orders and products
"""
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger('pharmacy')


class PrescriptionValidator:
    """Validate prescriptions for orders"""
    
    @staticmethod
    def validate_for_checkout(prescriptions, items):
        """
        Validate that prescriptions are valid for all prescription items in order
        
        Args:
            prescriptions: List of Prescription objects
            items: List of OrderItem objects
            
        Returns:
            tuple: (is_valid, errors)
        """
        errors = []
        
        if not prescriptions:
            errors.append("Prescription items require valid prescriptions")
            return False, errors
        
        for prescription in prescriptions:
            # Check if verified
            if not prescription.is_verified:
                errors.append(f"Prescription {prescription.id} is not verified")
                continue
            
            # Check if expired
            if prescription.status == 'Expired':
                errors.append(f"Prescription {prescription.id} has expired")
                continue
            
            # Check expiry date
            if prescription.expiry_date:
                if prescription.expiry_date < timezone.now().date():
                    days_expired = (timezone.now().date() - prescription.expiry_date).days
                    errors.append(f"Prescription {prescription.id} expired {days_expired} days ago")
                    continue
                
                # Warn if expiring soon
                days_until_expiry = (prescription.expiry_date - timezone.now().date()).days
                if days_until_expiry <= 7:
                    logger.warning(
                        f"Prescription {prescription.id} expiring in {days_until_expiry} days"
                    )
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_prescription_image(image_file):
        """Validate prescription image upload"""
        # Check file type
        allowed_types = ['image/jpeg', 'image/png', 'application/pdf']
        if image_file.content_type not in allowed_types:
            raise ValidationError("Only JPEG, PNG, or PDF files are allowed")
        
        # Check file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            raise ValidationError("File size cannot exceed 5MB")
        
        return True


class CouponValidator:
    """Validate coupons for orders"""
    
    @staticmethod
    def validate_for_user(coupon, user, cart_total, user_coupon_usage_count=0):
        """
        Validate if coupon can be applied by user
        
        Args:
            coupon: Coupon object
            user: User object
            cart_total: Total cart amount
            user_coupon_usage_count: Number of times user has used this coupon
            
        Returns:
            tuple: (is_valid, error_message)
        """
        # Check if coupon is valid
        if not coupon.is_valid:
            return False, "This coupon is no longer valid"
        
        # Check if user exceeded max uses
        if coupon.max_uses_per_user and user_coupon_usage_count >= coupon.max_uses_per_user:
            return False, f"You can only use this coupon {coupon.max_uses_per_user} time(s)"
        
        # Check minimum purchase
        if cart_total < coupon.min_purchase_amount:
            return False, f"Minimum purchase of {coupon.min_purchase_amount} required"
        
        return True, None
    
    @staticmethod
    def validate_for_products(coupon, product_ids):
        """
        Validate if coupon applies to the given products
        
        Args:
            coupon: Coupon object
            product_ids: List of product IDs in cart
            
        Returns:
            tuple: (applies, applicable_amount)
        """
        # If no products specified, applies to all
        if not coupon.applicable_to_products.exists():
            return True, sum(product_ids)
        
        # Check if at least one product is applicable
        applicable_products = coupon.applicable_to_products.filter(
            id__in=product_ids
        )
        
        if not applicable_products.exists():
            return False, 0
        
        # Calculate applicable amount
        applicable_amount = sum(
            p.price for p in applicable_products
        )
        
        return True, applicable_amount


class StockValidator:
    """Validate product stock for orders"""
    
    @staticmethod
    def validate_stock_availability(items):
        """
        Validate that all items have sufficient stock
        
        Args:
            items: List of (product, quantity) tuples
            
        Returns:
            tuple: (is_available, errors, insufficient_items)
        """
        errors = []
        insufficient_items = []
        
        for product, quantity in items:
            if not product.is_available:
                errors.append(f"{product.name} is not available")
                insufficient_items.append(product.id)
            elif product.stock < quantity:
                errors.append(
                    f"Only {product.stock} units of {product.name} available (requested {quantity})"
                )
                insufficient_items.append({
                    'product_id': product.id,
                    'available': product.stock,
                    'requested': quantity
                })
        
        return len(errors) == 0, errors, insufficient_items


class DeliveryValidator:
    """Validate delivery information"""
    
    @staticmethod
    def validate_delivery_slot(slot):
        """Validate if delivery slot is available"""
        if not slot.is_active:
            return False, "This delivery slot is no longer available"
        
        if slot.is_full:
            return False, "This delivery slot is fully booked"
        
        return True, None


class NotificationValidator:
    """Validate notification data"""
    
    @staticmethod
    def validate_notification_type(notification_type):
        """Validate notification type"""
        VALID_TYPES = [
            'order_status', 'prescription_verified', 'delivery',
            'promotion', 'reminder', 'alert'
        ]
        
        if notification_type not in VALID_TYPES:
            raise ValidationError(f"Invalid notification type: {notification_type}")
        
        return True
