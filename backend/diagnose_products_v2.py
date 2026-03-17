import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from products.models import Product, Category
import meilisearch

print(f"DB Products: {Product.objects.count()}")

try:
    client = meilisearch.Client('http://localhost:7700', 'masterKey')
    index = client.index('products')
    stats = index.get_stats()
    # In some versions it's a dict, in others it's an object. 
    # Let's check both.
    if hasattr(stats, 'number_of_documents'):
        count = stats.number_of_documents
    else:
        count = stats.get('numberOfDocuments', 0)
    print(f"Meilisearch Products: {count}")
    
    # Try a search
    search = index.search('')
    print(f"Meilisearch Search (all): {len(search['hits'])} hits found")

except Exception as e:
    print(f"Meilisearch Error: {e}")
