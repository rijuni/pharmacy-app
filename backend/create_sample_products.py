#!/usr/bin/env python
"""Create sample products for the pharmacy app"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from products.models import Category, Product
from decimal import Decimal

# Create categories
categories_data = [
    'Pain Relief', 'Cold & Cough', 'Vitamins & Minerals', 'Digestive Health', 'Skincare'
]

categories = {}
for cat_name in categories_data:
    cat, _ = Category.objects.get_or_create(name=cat_name)
    categories[cat_name] = cat
    print(f"Category: {cat_name}")

# Create sample products
products_data = [
    {'name': 'Paracetamol 500mg', 'category': 'Pain Relief', 'price': '45', 'stock': 100},
    {'name': 'Ibuprofen 200mg', 'category': 'Pain Relief', 'price': '65', 'stock': 80},
    {'name': 'Aspirin 300mg', 'category': 'Pain Relief', 'price': '35', 'stock': 150},
    {'name': 'Cough Syrup', 'category': 'Cold & Cough', 'price': '85', 'stock': 50},
    {'name': 'Cold Tablets', 'category': 'Cold & Cough', 'price': '75', 'stock': 70},
    {'name': 'Vitamin C 500mg', 'category': 'Vitamins & Minerals', 'price': '120', 'stock': 200},
    {'name': 'Vitamin D3 Capsules', 'category': 'Vitamins & Minerals', 'price': '150', 'stock': 100},
    {'name': 'Multivitamin Tablet', 'category': 'Vitamins & Minerals', 'price': '199', 'stock': 150},
    {'name': 'Antacid Suspension', 'category': 'Digestive Health', 'price': '95', 'stock': 75},
    {'name': 'Probiotic Capsules', 'category': 'Digestive Health', 'price': '250', 'stock': 60},
    {'name': 'Face Wash', 'category': 'Skincare', 'price': '180', 'stock': 120},
    {'name': 'Moisturizer Cream', 'category': 'Skincare', 'price': '320', 'stock': 90},
]

count = 0
for prod_data in products_data:
    p, created = Product.objects.get_or_create(
        name=prod_data['name'],
        defaults={
            'category': categories[prod_data['category']],
            'price': Decimal(prod_data['price']),
            'stock': prod_data['stock'],
            'description': f"{prod_data['name']} - High quality medicine",
            'availability_status': 'in_stock'
        }
    )
    if created:
        count += 1
        print(f'✓ Created: {prod_data["name"]}')
    else:
        print(f'→ Already exists: {prod_data["name"]}')

print(f'\n✓ Total products created: {count}')
print(f'✓ Total products in DB: {Product.objects.count()}')
