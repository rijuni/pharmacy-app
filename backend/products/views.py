from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, Review
from .serializers import CategorySerializer, ProductSerializer, ReviewSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'requires_prescription', 'availability_status']
    search_fields = ['name', 'generic_name', 'description', 'salt_composition']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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

import json
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

class BulkProductUploadView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = json.load(file_obj)
            if not isinstance(data, list):
                return Response({"error": "Invalid format. Expected a list of products."}, status=status.HTTP_400_BAD_REQUEST)
            
            created_count = 0
            updated_count = 0
            
            for item in data:
                category_name = item.pop('category_name', None)
                category = None
                if category_name:
                    category, _ = Category.objects.get_or_create(name=category_name)
                
                product_id = item.pop('id', None)
                if product_id:
                    # Update existing
                    try:
                        product = Product.objects.get(id=product_id)
                        for key, value in item.items():
                            setattr(product, key, value)
                        if category:
                            product.category = category
                        product.save()
                        updated_count += 1
                    except Product.DoesNotExist:
                        if category:
                            item['category'] = category
                        Product.objects.create(**item)
                        created_count += 1
                else:
                    # Create new
                    if category:
                        item['category'] = category
                    Product.objects.create(**item)
                    created_count += 1
            
            return Response({
                "message": f"Successfully processed {len(data)} items.",
                "created": created_count,
                "updated": updated_count
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON file."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

