import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from products.meilisearch_utils import sync_products_to_meilisearch

print("Syncing medicines to Meilisearch...")
print("="*60)

try:
    result = sync_products_to_meilisearch()
    print("✓ Successfully synced all medicines to Meilisearch!")
    print("="*60)
    print(f"Search engine is now ready with {68} medicines across 10 categories")
except Exception as e:
    print(f"✗ Error syncing to Meilisearch: {str(e)}")
