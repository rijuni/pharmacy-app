from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'requires_prescription', 'availability_status']
    search_fields = ['name', 'generic_name', 'description', 'salt_composition']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']
from rest_framework.views import APIView
from rest_framework.response import Response

from .meilisearch_utils import get_meilisearch_client

class ProductSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        q = request.query_params.get('q', '')
        category = request.query_params.get('category')
        prescription = request.query_params.get('requires_prescription')

        client = get_meilisearch_client()
        index = client.index('products')

        search_params = {
            'limit': 20,
        }

        # Handle Filters
        filters = []
        if category:
            filters.append(f"category = '{category}'")
        if prescription is not None:
            filters.append(f"requires_prescription = {prescription.lower()}")
        
        if filters:
            search_params['filter'] = ' AND '.join(filters)

        try:
            results = index.search(q, search_params)
            return Response(results['hits'])
        except Exception as e:
            print(f"Meilisearch search failed: {e}. Falling back to DB search.")
            # Fallback to standard DB search if Meilisearch fails
            products = Product.objects.filter(name__icontains=q)
            if category:
                products = products.filter(category_id=category)
            
            from .serializers import ProductSerializer
            serializer = ProductSerializer(products[:20], many=True)
            return Response(serializer.data)
