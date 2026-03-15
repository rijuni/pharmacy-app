from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'generic_name', 'category', 'category_name',
            'description', 'price', 'stock', 'image', 'requires_prescription',
            'availability_status', 'manufacturer', 'strength', 'form',
            'is_available', 'created_at', 'updated_at'
        ]
    
    def get_is_available(self, obj):
        return obj.is_available

