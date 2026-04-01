from django.contrib import admin
from .models import Category, Product, Review, Discount, ProductVariant

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'generic_name', 'category', 'price', 'strength', 'form', 'stock', 'is_available', 'requires_prescription', 'availability_status')
    list_filter = ('category', 'requires_prescription', 'availability_status', 'created_at')
    search_fields = ('name', 'generic_name', 'manufacturer')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'generic_name', 'category', 'description')
        }),
        ('Medicine Details', {
            'fields': ('strength', 'form', 'manufacturer', 'salt_composition', 'side_effects', 'how_to_use', 'expert_tips')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'stock', 'batch_number', 'expiry_date', 'availability_status')
        }),
        ('Regulations', {
            'fields': ('requires_prescription',)
        }),
        ('Media', {
            'fields': ('image',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'variant_name', 'quantity', 'additional_price', 'created_at')
    list_filter = ('product', 'created_at')
    search_fields = ('variant_name', 'product__name')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Variant Details', {
            'fields': ('product', 'variant_name', 'quantity', 'additional_price')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__email', 'comment')
    readonly_fields = ('created_at',)

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'min_purchase', 'is_active', 'valid_from', 'valid_until')
    list_filter = ('is_active', 'discount_type', 'created_at')
    search_fields = ('code', 'description')
    readonly_fields = ('created_at', 'updated_at', 'current_uses', 'total_discount_given')
    fieldsets = (
        ('Coupon Details', {
            'fields': ('code', 'description', 'discount_type', 'discount_value', 'max_discount_amount')
        }),
        ('Conditions', {
            'fields': ('min_purchase', 'max_uses', 'max_uses_per_user', 'applicable_categories', 'excluded_products')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_until', 'is_active')
        }),
        ('Statistics', {
            'fields': ('current_uses', 'total_discount_given'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['activate_discount', 'deactivate_discount']

    def activate_discount(self, request, queryset):
        queryset.update(is_active=True)
    activate_discount.short_description = "Activate selected discounts"

    def deactivate_discount(self, request, queryset):
        queryset.update(is_active=False)
    deactivate_discount.short_description = "Deactivate selected discounts"

