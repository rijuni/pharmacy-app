from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, ProductSearchView, ReviewViewSet, BulkProductUploadView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('search/', ProductSearchView.as_view(), name='product-search'),
    path('bulk-upload/', BulkProductUploadView.as_view(), name='bulk-product-upload'),
    path('', include(router.urls)),
]

