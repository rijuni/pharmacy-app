from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from .models import (Order, OrderItem, Product, OrderCancellationRequest, 
                     Refund, OrderDelivery, Prescription)
from products.models import Notification, ProductStock, StockMovement, Coupon, CouponUsage
from backend_project.utils import send_notification, log_action
import logging

logger = logging.getLogger('pharmacy')


@receiver(post_save, sender=Order)
def handle_order_status(sender, instance, created, **kwargs):
    """Handle order creation and status changes"""
    if created:
        # New order created
        send_order_confirmation_email(instance)
        log_action('order_created', {'order_id': instance.id, 'total': str(instance.total_price)}, user=instance.user)
        
        # Reserve stock for the order
        try:
            for item in instance.items.all():
                stock_info = ProductStock.objects.get(product=item.product)
                stock_info.reserve_stock(item.quantity)
                
                # Log stock movement
                StockMovement.objects.create(
                    product=item.product,
                    movement_type='reserve',
                    quantity=item.quantity,
                    order=instance,
                    notes=f'Reserved for order #{instance.id}'
                )
        except Exception as e:
            logger.error(f"Error reserving stock for order {instance.id}: {str(e)}")
        
        # Create delivery record
        OrderDelivery.objects.get_or_create(
            order=instance,
            defaults={'estimated_delivery_date': timezone.now().date()}
        )
    
    else:
        # Order status changed
        send_order_status_update_email(instance)
        log_action('order_status_updated', {'order_id': instance.id, 'status': instance.status}, user=instance.user)
        
        # Create notification for status change
        status_messages = {
            'Processing': 'Your order is being processed',
            'Shipped': 'Your order has been shipped',
            'Delivered': 'Your order has been delivered',
            'Cancelled': 'Your order has been cancelled',
        }
        
        if instance.status in status_messages:
            send_notification(
                user=instance.user,
                notification_type='order_status',
                title=f'Order #{instance.id} {instance.status}',
                message=status_messages[instance.status],
                order=instance
            )


@receiver(post_save, sender=OrderCancellationRequest)
def handle_cancellation_approval(sender, instance, **kwargs):
    """Handle order cancellation approval"""
    if instance.status == 'approved':
        # Create refund
        Refund.objects.create(
            order=instance.order,
            cancellation_request=instance,
            refund_amount=instance.order.total_price,
            refund_method='original_payment',
            status='pending'
        )
        
        # Release reserved stock
        try:
            for item in instance.order.items.all():
                stock_info = ProductStock.objects.get(product=item.product)
                stock_info.release_reserved_stock(item.quantity)
                
                # Log stock movement
                StockMovement.objects.create(
                    product=item.product,
                    movement_type='release',
                    quantity=item.quantity,
                    order=instance.order,
                    notes=f'Released due to order cancellation'
                )
        except Exception as e:
            logger.error(f"Error releasing stock for cancelled order {instance.order.id}: {str(e)}")
        
        # Update order status
        instance.order.status = 'Cancelled'
        instance.order.save()
        
        # Notify user
        send_notification(
            user=instance.user,
            notification_type='order_status',
            title=f'Order #{instance.order.id} Cancelled',
            message=f'Your cancellation request has been approved. Refund will be processed shortly.',
            order=instance.order
        )
        
        log_action('order_cancelled', {'order_id': instance.order.id}, user=instance.user)


@receiver(post_save, sender=Refund)
def handle_refund_completion(sender, instance, **kwargs):
    """Handle refund processing"""
    if instance.status == 'completed':
        # Update order payment status
        instance.order.payment_status = 'refunded'
        instance.order.save()
        
        # Notify user
        send_notification(
            user=instance.order.user,
            notification_type='alert',
            title='Refund Processed',
            message=f'Refund of {instance.refund_amount} has been processed successfully.',
            order=instance.order
        )
        
        log_action('refund_processed', {
            'order_id': instance.order.id,
            'refund_amount': str(instance.refund_amount)
        }, user=instance.order.user)


@receiver(post_save, sender=Prescription)
def notify_prescription_verification(sender, instance, created, **kwargs):
    """Notify user when prescription is verified"""
    if not created and instance.status == 'Verified' and instance.is_verified:
        send_notification(
            user=instance.user,
            notification_type='prescription_verified',
            title='Prescription Verified',
            message='Your prescription has been verified by our pharmacist.',
        )
        log_action('prescription_verified', {'prescription_id': instance.id}, user=instance.user)


def send_order_confirmation_email(order):
    """Send order confirmation email"""
    try:
        subject = f'Order Confirmation - #{order.id}'
        message = f"""
Hello {order.user.username},

Thank you for your order! Here are the details:

Order ID: #{order.id}
Total Price: ₹{order.total_price}
Status: {order.status}
Payment Method: {order.get_payment_method_display()}

Your order will be delivered to:
{order.address.street}, {order.address.city}, {order.address.state} - {order.address.zip_code}

Thank you for shopping with us!

Best regards,
Health Meds Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [order.user.email],
            fail_silently=False,
        )
        logger.info(f"Order confirmation email sent for order {order.id}")
    except Exception as e:
        logger.error(f"Error sending order confirmation email: {str(e)}")


def send_order_status_update_email(order):
    """Send order status update email"""
    try:
        subject = f'Order Update - #{order.id}'
        message = f"""
Hello {order.user.username},

Your order #{order.id} status has been updated.

New Status: {order.status}
Total Price: ₹{order.total_price}

If you have any questions, please contact our support team.

Best regards,
Health Meds Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [order.user.email],
            fail_silently=False,
        )
        logger.info(f"Status update email sent for order {order.id}")
    except Exception as e:
        logger.error(f"Error sending status email: {str(e)}")

