from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Order, Product

@receiver(post_save, sender=Order)
def send_order_status_email(sender, instance, created, **kwargs):
    if created:
        subject = f'Order Received: #{instance.id}'
        message = f'Hello {instance.user.username},\n\nWe have received your order #{instance.id}. Current status: {instance.status}.'
    else:
        # Check if status changed by comparing with old values (simplified here)
        subject = f'Order Update: #{instance.id}'
        message = f'Hello {instance.user.username},\n\nYour order #{instance.id} status has been updated to: {instance.status}.'
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [instance.user.email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Error sending email: {e}")

@receiver(post_save, sender=Product)
def check_low_stock(sender, instance, **kwargs):
    if instance.stock <= 5:
        # Send alert to admin (simplified)
        print(f"LOW STOCK ALERT: {instance.name} is down to {instance.stock} units.")
