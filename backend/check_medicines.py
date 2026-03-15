import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from products.models import Product, Category

total = Product.objects.count()
in_stock = Product.objects.filter(availability_status='in_stock').count()
out_of_stock = Product.objects.filter(availability_status='out_of_stock').count()
rx_required = Product.objects.filter(requires_prescription=True).count()
categories = Category.objects.count()

print(f'Total Medicines: {total}')
print(f'Categories: {categories}')
print(f'In Stock: {in_stock}')
print(f'Out of Stock: {out_of_stock}')
print(f'Rx Required: {rx_required}')
