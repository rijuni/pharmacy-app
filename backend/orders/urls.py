from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_cart, add_to_cart, remove_from_cart, OrderViewSet, PrescriptionViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')

urlpatterns = [
    path('cart/', get_cart, name='get_cart'),
    path('cart/add/', add_to_cart, name='add_to_cart'),
    path('cart/remove/', remove_from_cart, name='remove_from_cart'),
    path('', include(router.urls)),
]
