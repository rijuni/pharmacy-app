from django.contrib import admin
from .models import Category, Product

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
            'fields': ('strength', 'form', 'manufacturer')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'stock', 'availability_status')
        }),
        ('Regulations', {
            'fields': ('requires_prescription',)
        }),
        ('Media', {
            'fields': ('image',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')

