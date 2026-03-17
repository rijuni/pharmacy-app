from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Product
from .meilisearch_utils import get_meilisearch_client

@receiver(post_save, sender=Product)
def sync_product_on_save(sender, instance, **kwargs):
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

@receiver(post_delete, sender=Product)
def remove_product_on_delete(sender, instance, **kwargs):
    client = get_meilisearch_client()
    index = client.index('products')
    index.delete_document(instance.id)
