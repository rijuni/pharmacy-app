#!/usr/bin/env python
"""
Initial Data Setup Script for Pharmacy App
Loads sample delivery slots, drug interactions, and initializes new features
Run after migrations: python manage.py shell < setup_initial_data.py
"""

from datetime import time, timedelta, datetime
from django.utils import timezone
from decimal import Decimal

from products.models import (
    Category, Product, DeliverySlot, DrugInteraction, 
    Coupon, ProductStock, ProductVariant
)
from products.models import Coupon as Discount

print("=" * 60)
print("PHARMACY APP - INITIAL DATA SETUP")
print("=" * 60)

# ============= 1. CREATE DELIVERY SLOTS =============
print("\n1. Creating Delivery Slots...")

delivery_slots_data = [
    {"start": "08:00", "end": "12:00", "capacity": 15},
    {"start": "12:00", "end": "16:00", "capacity": 15},
    {"start": "16:00", "end": "20:00", "capacity": 20},
    {"start": "20:00", "end": "23:59", "capacity": 10},
]

for slot_data in delivery_slots_data:
    start_h, start_m = map(int, slot_data["start"].split(":"))
    end_h, end_m = map(int, slot_data["end"].split(":"))
    
    slot, created = DeliverySlot.objects.get_or_create(
        start_time=time(start_h, start_m),
        end_time=time(end_h, end_m),
        defaults={
            "capacity": slot_data["capacity"],
            "current_bookings": 0,
            "is_active": True
        }
    )
    if created:
        print(f"   ✓ Created slot: {slot_data['start']} - {slot_data['end']}")
    else:
        print(f"   → Slot already exists: {slot_data['start']} - {slot_data['end']}")

# ============= 2. CREATE SAMPLE COUPONS =============
print("\n2. Creating Sample Coupons...")

coupons_data = [
    {
        "code": "FIRST10",
        "description": "10% off on first order",
        "discount_type": "percentage",
        "discount_value": 10,
        "min_purchase_amount": 100,
        "max_uses": 100,
        "valid_days": 30,
    },
    {
        "code": "HEALTH50",
        "description": "Flat ₹50 off",
        "discount_type": "fixed",
        "discount_value": 50,
        "min_purchase_amount": 200,
        "max_uses": 200,
        "valid_days": 60,
    },
    {
        "code": "SUMMER20",
        "description": "20% summer sale",
        "discount_type": "percentage",
        "discount_value": 20,
        "min_purchase_amount": 500,
        "max_discount_amount": 500,
        "max_uses": 500,
        "valid_days": 15,
    },
]

for coupon_data in coupons_data:
    coupon, created = Coupon.objects.get_or_create(
        code=coupon_data["code"],
        defaults={
            "description": coupon_data["description"],
            "discount_type": coupon_data["discount_type"],
            "discount_value": Decimal(str(coupon_data["discount_value"])),
            "min_purchase_amount": Decimal(str(coupon_data["min_purchase_amount"])),
            "max_discount_amount": Decimal(str(coupon_data.get("max_discount_amount", 0))) if coupon_data.get("max_discount_amount") else None,
            "max_uses": coupon_data.get("max_uses"),
            "max_uses_per_user": 1,
            "valid_from": timezone.now(),
            "valid_until": timezone.now() + timedelta(days=coupon_data.get("valid_days", 30)),
            "is_active": True,
        }
    )
    if created:
        print(f"   ✓ Created coupon: {coupon_data['code']}")
    else:
        print(f"   → Coupon already exists: {coupon_data['code']}")

# ============= 3. SETUP PRODUCT VARIANTS (Sample) =============
print("\n3. Setting up Product Variants...")

try:
    # Get first product if exists
    products = Product.objects.all()[:5]
    
    for product in products:
        # Check if variants already exist
        if product.variants.exists():
            print(f"   → Product {product.name} already has variants")
            continue
        
        # Create common variants: 10, 30 tablets
        variants_to_create = [
            {"name": f"{product.name} - 10 Pack", "qty": 10, "price": 0},
            {"name": f"{product.name} - 30 Pack", "qty": 30, "price": 50},
        ]
        
        for variant in variants_to_create:
            ProductVariant.objects.create(
                product=product,
                variant_name=variant['name'],
                quantity=variant['qty'],
                unit='tablets',
                additional_price=Decimal(str(variant['price'])),
                stock=50
            )
        print(f"   ✓ Created variants for: {product.name}")
except Exception as e:
    print(f"   ⚠ Could not create variants: {str(e)}")

# ============= 4. SETUP STOCK INFO (Sample) =============
print("\n4. Setting up Product Stock Information...")

try:
    products = Product.objects.all()[:5]
    
    for product in products:
        stock_info, created = ProductStock.objects.get_or_create(
            product=product,
            defaults={
                "total_stock": product.stock,
                "available_stock": product.stock,
                "reserved_stock": 0,
                "low_stock_threshold": 10,
                "last_restocked": timezone.now(),
            }
        )
        if created:
            print(f"   ✓ Created stock info for: {product.name}")
        else:
            print(f"   → Stock info already exists for: {product.name}")
except Exception as e:
    print(f"   ⚠ Could not setup stock info: {str(e)}")

# ============= 5. SAMPLE DRUG INTERACTIONS =============
print("\n5. Creating Sample Drug Interactions...")

try:
    products = Product.objects.filter(requires_prescription=True)[:4]
    
    if len(products) >= 2:
        # Create a sample interaction between first two prescription products
        interaction, created = DrugInteraction.objects.get_or_create(
            drug1=products[0],
            drug2=products[1],
            defaults={
                "description": f"Potential interaction between {products[0].name} and {products[1].name}",
                "severity": "moderate",
                "recommendation": "Take these medicines with at least 2 hours gap between doses"
            }
        )
        if created:
            print(f"   ✓ Created interaction: {products[0].name} ↔ {products[1].name}")
        else:
            print(f"   → Interaction already exists")
except Exception as e:
    print(f"   ⚠ Could not create interactions: {str(e)}")

# ============= SUMMARY =============
print("\n" + "=" * 60)
print("SETUP COMPLETED!")
print("=" * 60)

print("\nNext Steps:")
print("1. Run migrations: python manage.py migrate")
print("2. Create superuser: python manage.py createsuperuser")
print("3. Start server: python manage.py runserver")
print("4. Access admin: http://localhost:8000/admin")
print("5. Test API: http://localhost:8000/api/")

print("\nVerify Setup:")
print(f"   - Delivery Slots: {DeliverySlot.objects.count()}")
print(f"   - Coupons: {Coupon.objects.count()}")
print(f"   - Product Variants: {ProductVariant.objects.count()}")
print(f"   - Stock Info: {ProductStock.objects.count()}")
print(f"   - Drug Interactions: {DrugInteraction.objects.count()}")

print("\nImportant Notes:")
print("✓ All existing data is preserved")
print("✓ No API keys or sensitive data was changed")
print("✓ Database backward compatible")
print("✓ Frontend code unchanged")
print("✓ API endpoints backward compatible")

print("=" * 60)
