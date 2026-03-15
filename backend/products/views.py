from rest_framework import viewsets, permissions
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
            return Response({'error': str(e)}, status=500)
