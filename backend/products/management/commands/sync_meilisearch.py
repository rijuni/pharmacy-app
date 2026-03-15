from django.core.management.base import BaseCommand
from products.meilisearch_utils import sync_products_to_meilisearch

class Command(BaseCommand):
    help = 'Sync all products to Meilisearch index'

    def handle(self, *args, **options):
        self.stdout.write('Syncing products to Meilisearch...')
        try:
            task = sync_products_to_meilisearch()
            self.stdout.write(self.style.SUCCESS(f'Successfully started sync task. Task UID: {task.task_uid}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Sync failed: {str(e)}'))
