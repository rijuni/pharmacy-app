from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    get_cart, add_to_cart, remove_from_cart, OrderViewSet, 
    PrescriptionViewSet, create_payment_intent, 
    create_razorpay_order, verify_razorpay_payment,
    get_admin_reports
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')

urlpatterns = [
    path('cart/', get_cart, name='get_cart'),
    path('cart/add/', add_to_cart, name='add_to_cart'),
    path('cart/remove/', remove_from_cart, name='remove_from_cart'),
    path('payment/create-intent/', create_payment_intent, name='create_payment_intent'),
    path('payment/razorpay-order/', create_razorpay_order, name='create_razorpay_order'),
    path('payment/verify-razorpay/', verify_razorpay_payment, name='verify_razorpay_payment'),
    path('reports/', get_admin_reports, name='admin_reports'),
    path('', include(router.urls)),
]
