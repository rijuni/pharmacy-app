import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from products.models import Product, Category
import meilisearch

print(f"DB Products: {Product.objects.count()}")
print(f"DB Categories: {Category.objects.count()}")

try:
    client = meilisearch.Client('http://localhost:7700', 'masterKey')
    index = client.index('products')
    stats = index.get_stats()
    print(f"Meilisearch Products: {stats['numberOfDocuments']}")
except Exception as e:
    print(f"Meilisearch Error: {e}")
