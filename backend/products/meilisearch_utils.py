import meilisearch
from django.conf import settings
from .models import Product

def get_meilisearch_client():
    # We'll add these to settings.py shortly
    host = getattr(settings, 'MEILISEARCH_HOST', 'http://localhost:7700')
    api_key = getattr(settings, 'MEILISEARCH_API_KEY', 'masterKey')
    return meilisearch.Client(host, api_key)

def sync_products_to_meilisearch():
    client = get_meilisearch_client()
    index = client.index('products')
    
    products = Product.objects.all()
    documents = []
    
    for product in products:
        documents.append({
            'id': product.id,
            'name': product.name,
            'generic_name': product.generic_name or '',
            'description': product.description or '',
            'price': float(product.price),
            'stock': product.stock,
            'requires_prescription': product.requires_prescription,
            'category': product.category.name if product.category else 'Uncategorized',
            'manufacturer': product.manufacturer or '',
            'strength': product.strength or '',
            'form': product.form or '',
            'availability_status': product.availability_status,
            'is_available': product.is_available,
        })
    
    # Update index settings for better search
    index.update_searchable_attributes([
        'name', 'generic_name', 'description', 'category', 'manufacturer', 'strength', 'form'
    ])
    index.update_filterable_attributes([
        'category', 'requires_prescription', 'availability_status', 'is_available'
    ])
    index.update_sortable_attributes(['price', 'name'])
    
    return index.add_documents(documents)
