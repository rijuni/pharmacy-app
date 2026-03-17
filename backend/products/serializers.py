from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_available = serializers.SerializerMethodField()
    substitutes = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'generic_name', 'category', 'category_name',
            'description', 'price', 'stock', 'image', 'requires_prescription',
            'availability_status', 'manufacturer', 'strength', 'form',
            'salt_composition', 'side_effects', 'expert_tips', 'interactions', 'how_to_use',
            'is_available', 'substitutes', 'created_at', 'updated_at'
        ]
    
    def get_is_available(self, obj):
        return obj.is_available

    def get_substitutes(self, obj):
        if not obj.salt_composition:
            return []
        
        # Find other products with the same salt composition, excluding current product
        substitutes = Product.objects.filter(
            salt_composition__icontains=obj.salt_composition
        ).exclude(id=obj.id)[:5]
        
        # Return simplified version of substitutes to avoid deep nesting
        return [{
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'image': p.image.url if p.image else None,
            'manufacturer': p.manufacturer
        } for p in substitutes]

