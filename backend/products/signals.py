from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.core.cache import cache
from .models import Product, ProductStock, StockMovement, Favorite, Notification
from .meilisearch_utils import get_meilisearch_client
import logging

logger = logging.getLogger('pharmacy')


@receiver(post_save, sender=Product)
def sync_product_on_save(sender, instance, **kwargs):
    """Sync product with Meilisearch and invalidate cache"""
    client = get_meilisearch_client()
    index = client.index('products')
    
    document = {
        'id': instance.id,
        'name': instance.name,
        'generic_name': instance.generic_name or '',
        'description': instance.description or '',
        'price': float(instance.price),
        'stock': instance.stock,
        'requires_prescription': instance.requires_prescription,
        'category': instance.category.name if instance.category else 'Uncategorized',
        'manufacturer': instance.manufacturer or '',
        'strength': instance.strength or '',
        'form': instance.form or '',
        'availability_status': instance.availability_status,
        'is_available': instance.is_available,
        'salt_composition': instance.salt_composition or '',
        'side_effects': instance.side_effects or '',
        'expert_tips': instance.expert_tips or '',
        'how_to_use': instance.how_to_use or '',
    }
    
    index.add_documents([document])
    
    # Invalidate product cache
    cache_key = f"product:{instance.id}"
    cache.delete(cache_key)
    logger.info(f"Product {instance.id} synced to Meilisearch")


@receiver(post_delete, sender=Product)
def remove_product_on_delete(sender, instance, **kwargs):
    """Remove product from Meilisearch and cache"""
    client = get_meilisearch_client()
    index = client.index('products')
    index.delete_document(instance.id)
    
    # Clear cache
    cache_key = f"product:{instance.id}"
    cache.delete(cache_key)
    logger.info(f"Product {instance.id} removed from Meilisearch")


@receiver(post_save, sender=Product)
def create_stock_info_on_product_create(sender, instance, created, **kwargs):
    """Create ProductStock entry when Product is created"""
    if created:
        ProductStock.objects.get_or_create(
            product=instance,
            defaults={
                'total_stock': instance.stock,
                'available_stock': instance.stock,
            }
        )
        logger.info(f"Stock info created for product {instance.id}")


@receiver(pre_save, sender=Product)
def check_low_stock_before_save(sender, instance, **kwargs):
    """Check and notify if product stock is getting low"""
    try:
        old_instance = Product.objects.get(pk=instance.pk)
        
        # Check if stock decreased significantly
        if old_instance.stock > 20 and instance.stock <= 20:
            logger.warning(f"Product {instance.id} ({instance.name}) is running low on stock: {instance.stock}")
            
            # TODO: Alert admin about low stock
    except Product.DoesNotExist:
        pass  # New product, skip check


@receiver(post_save, sender=StockMovement)
def log_stock_movement(sender, instance, created, **kwargs):
    """Log stock movements for audit trail"""
    if created:
        logger.info(
            f"Stock movement: {instance.product.name} - "
            f"{instance.get_movement_type_display()}: {instance.quantity} units"
        )


@receiver(post_save, sender=Favorite)
def notify_favorite_product_update(sender, instance, created, **kwargs):
    """Notify user when favorited product has updates/discounts"""
    if created:
        logger.debug(f"Product {instance.product.name} added to favorites by {instance.user.email}")
    
    # TODO: Check if there are active discounts on favorited products
    # TODO: Send notification to user about discounts


@receiver(post_save, sender=Notification)
def send_notification(sender, instance, created, **kwargs):
    """Send notification via email/push when created"""
    if created:
        # TODO: Send email notification
        # TODO: Send push notification via Firebase
        # TODO: Send SMS for critical notifications
        logger.info(f"Notification created for {instance.user.email}: {instance.title}")

