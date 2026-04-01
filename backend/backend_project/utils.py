"""
Utility functions for the pharmacy app
"""
import logging
from functools import wraps
from django.core.cache import cache
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta

logger = logging.getLogger('pharmacy')


class RateLimiter:
    """Rate limiting utility using Redis cache"""
    
    def __init__(self, key_prefix, limit, window_seconds):
        self.key_prefix = key_prefix
        self.limit = limit
        self.window = window_seconds

    def get_key(self, identifier):
        return f"{self.key_prefix}:{identifier}"

    def is_allowed(self, identifier):
        key = self.get_key(identifier)
        current = cache.get(key, 0)
        
        if current >= self.limit:
            return False
        
        cache.set(key, current + 1, self.window)
        return True

    def get_remaining(self, identifier):
        key = self.get_key(identifier)
        current = cache.get(key, 0)
        return max(0, self.limit - current)


def rate_limit_decorator(identifier_func, limit=5, window=60):
    """
    Decorator to rate limit API endpoints
    
    Args:
        identifier_func: Function that takes request and returns identifier (e.g., user_id, IP)
        limit: Number of requests allowed
        window: Time window in seconds
    """
    def decorator(view_func):
        limiter = RateLimiter(
            key_prefix=f"{view_func.__module__}.{view_func.__name__}",
            limit=limit,
            window=window
        )
        
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            identifier = identifier_func(request)
            
            if not limiter.is_allowed(identifier):
                return Response(
                    {'error': 'Rate limit exceeded. Please try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def log_action(action, details, user=None, level='info'):
    """
    Log user actions for audit trail
    
    Args:
        action: Action name (e.g., 'order_created', 'coupon_applied')
        details: Dictionary with action details
        user: User object
        level: Log level ('debug', 'info', 'warning', 'error')
    """
    log_message = f"[{action}] {details}"
    if user:
        log_message += f" | User: {user.id} ({user.email})"
    
    log_func = getattr(logger, level, logger.info)
    log_func(log_message)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def validate_prescription_expiry(prescription):
    """
    Validate if prescription is still valid
    
    Args:
        prescription: Prescription object
        
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not prescription.is_verified:
        return False, "Prescription is not verified"
    
    if prescription.status == 'Expired':
        return False, "Prescription has expired"
    
    if prescription.expiry_date:
        from django.utils import timezone
        if prescription.expiry_date < timezone.now().date():
            return False, f"Prescription expired on {prescription.expiry_date}"
    
    return True, None


def cache_with_timeout(timeout=3600, key_func=None):
    """
    Decorator to cache function results
    
    Args:
        timeout: Cache timeout in seconds
        key_func: Function to generate cache key (default: function name + args)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            result = cache.get(cache_key)
            if result is None:
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout)
            
            return result
        
        return wrapper
    return decorator


def send_notification(user, notification_type, title, message, order=None, product=None):
    """
    Create and send notification to user
    
    Args:
        user: User object
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        order: Related Order object (optional)
        product: Related Product object (optional)
    """
    from products.models import Notification
    
    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        order=order,
        product=product
    )
    
    # TODO: Send email notification
    # TODO: Send push notification via Firebase
    
    log_action('notification_created', {
        'notification_id': notification.id,
        'type': notification_type
    }, user=user)
    
    return notification


def calculate_discount_for_coupon(coupon, cart_total):
    """
    Calculate discount amount from coupon
    
    Args:
        coupon: Coupon object
        cart_total: Total cart amount
        
    Returns:
        Discount amount
    """
    return coupon.calculate_discount(cart_total)
