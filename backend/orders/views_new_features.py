"""
API Views for order-related features (cancellation, refunds, delivery)
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal

from .models import (
    Order, OrderCancellationRequest, Refund, OrderDelivery, Prescription
)
from .serializers import (
    OrderCancellationSerializer, RefundSerializer, OrderDeliverySerializer,
    PrescriptionSerializer
)
from products.models import DeliverySlot, ProductStock, StockMovement
from backend_project.validators import (
    PrescriptionValidator, DeliveryValidator, StockValidator
)
from backend_project.utils import log_action, send_notification


# ============= ORDER CANCELLATION VIEWS =============
class OrderCancellationViewSet(viewsets.ViewSet):
    """
    Order cancellation requests
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get user's cancellation requests"""
        cancellations = OrderCancellationRequest.objects.filter(user=request.user)
        serializer = OrderCancellationSerializer(cancellations, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Get specific cancellation request"""
        cancellation = get_object_or_404(
            OrderCancellationRequest,
            id=pk,
            user=request.user
        )
        serializer = OrderCancellationSerializer(cancellation)
        return Response(serializer.data)

    def create(self, request):
        """
        Request order cancellation
        POST: {
            "order_id": 123,
            "reason": "change_mind",
            "comments": "Optional comments"
        }
        """
        order_id = request.data.get('order_id')
        reason = request.data.get('reason')
        comments = request.data.get('comments', '')

        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get order and verify ownership
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if cancellation already exists
        if OrderCancellationRequest.objects.filter(order=order).exists():
            return Response(
                {'error': 'Cancellation request already exists for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create cancellation request
        cancellation = OrderCancellationRequest.objects.create(
            order=order,
            user=request.user,
            reason=reason,
            comments=comments,
            status='pending'
        )

        log_action('cancellation_requested', {
            'order_id': order_id,
            'reason': reason
        }, user=request.user)

        # Notify user
        send_notification(
            user=request.user,
            notification_type='alert',
            title='Cancellation Request Submitted',
            message='Your cancellation request has been submitted for review',
            order=order
        )

        serializer = OrderCancellationSerializer(cancellation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        """Approve cancellation request (admin only)"""
        cancellation = get_object_or_404(OrderCancellationRequest, id=pk)

        if cancellation.status != 'pending':
            return Response(
                {'error': f'Cannot approve {cancellation.status} cancellation'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cancellation.status = 'approved'
        cancellation.processed_at = timezone.now()
        cancellation.processed_by = request.user
        cancellation.save()

        log_action('cancellation_approved', {
            'cancellation_id': cancellation.id,
            'order_id': cancellation.order.id
        }, user=request.user)

        # Send notification to user
        send_notification(
            user=cancellation.user,
            notification_type='alert',
            title='Cancellation Approved',
            message='Your order cancellation has been approved',
            order=cancellation.order
        )

        serializer = OrderCancellationSerializer(cancellation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Reject cancellation request (admin only)"""
        cancellation = get_object_or_404(OrderCancellationRequest, id=pk)

        if cancellation.status != 'pending':
            return Response(
                {'error': f'Cannot reject {cancellation.status} cancellation'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cancellation.status = 'rejected'
        cancellation.processed_at = timezone.now()
        cancellation.processed_by = request.user
        cancellation.admin_notes = request.data.get('notes', '')
        cancellation.save()

        log_action('cancellation_rejected', {
            'cancellation_id': cancellation.id,
            'order_id': cancellation.order.id
        }, user=request.user)

        # Notify user
        send_notification(
            user=cancellation.user,
            notification_type='alert',
            title='Cancellation Request Rejected',
            message=cancellation.admin_notes or 'Your cancellation request could not be processed',
            order=cancellation.order
        )

        serializer = OrderCancellationSerializer(cancellation)
        return Response(serializer.data)


# ============= REFUND VIEWS =============
class RefundViewSet(viewsets.ViewSet):
    """
    Order refunds
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get user's refunds"""
        refunds = Refund.objects.filter(order__user=request.user)
        serializer = RefundSerializer(refunds, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Get specific refund details"""
        refund = get_object_or_404(
            Refund,
            id=pk,
            order__user=request.user
        )
        serializer = RefundSerializer(refund)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def process(self, request, pk=None):
        """Process refund (admin only)"""
        refund = get_object_or_404(Refund, id=pk)

        if refund.status != 'pending':
            return Response(
                {'error': f'Cannot process {refund.status} refund'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refund.status = 'processing'
        refund.save()

        log_action('refund_processing', {
            'refund_id': refund.id,
            'order_id': refund.order.id,
            'amount': str(refund.refund_amount)
        }, user=request.user)

        serializer = RefundSerializer(refund)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def complete(self, request, pk=None):
        """Complete refund (admin only)"""
        refund = get_object_or_404(Refund, id=pk)

        if refund.status != 'processing':
            return Response(
                {'error': f'Refund must be in processing state'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refund.status = 'completed'
        refund.transaction_id = request.data.get('transaction_id', '')
        refund.refund_notes = request.data.get('notes', '')
        refund.completed_at = timezone.now()
        refund.save()

        log_action('refund_completed', {
            'refund_id': refund.id,
            'order_id': refund.order.id
        }, user=request.user)

        # Notify user
        send_notification(
            user=refund.order.user,
            notification_type='alert',
            title='Refund Processed',
            message=f'Refund of ₹{refund.refund_amount} has been successfully processed',
            order=refund.order
        )

        serializer = RefundSerializer(refund)
        return Response(serializer.data)


# ============= ORDER DELIVERY VIEWS =============
class OrderDeliveryViewSet(viewsets.ViewSet):
    """
    Order delivery tracking
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get user's deliveries"""
        deliveries = OrderDelivery.objects.filter(order__user=request.user)
        serializer = OrderDeliverySerializer(deliveries, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Get delivery details"""
        delivery = get_object_or_404(
            OrderDelivery,
            id=pk,
            order__user=request.user
        )
        serializer = OrderDeliverySerializer(delivery)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def assign(self, request, pk=None):
        """Assign delivery to partner (admin only)"""
        delivery = get_object_or_404(OrderDelivery, id=pk)

        if delivery.status not in ['pending', 'assigned']:
            return Response(
                {'error': f'Cannot assign delivery with status {delivery.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        delivery.status = 'assigned'
        delivery.delivery_partner = request.data.get('delivery_partner', '')
        delivery.tracking_number = request.data.get('tracking_number', '')
        delivery.save()

        log_action('delivery_assigned', {
            'delivery_id': delivery.id,
            'order_id': delivery.order.id,
            'partner': delivery.delivery_partner
        }, user=request.user)

        # Notify user
        send_notification(
            user=delivery.order.user,
            notification_type='delivery',
            title='Delivery Assigned',
            message=f'Your order is being delivered by {delivery.delivery_partner}',
            order=delivery.order
        )

        serializer = OrderDeliverySerializer(delivery)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_in_transit(self, request, pk=None):
        """Mark delivery as in transit (admin only)"""
        delivery = get_object_or_404(OrderDelivery, id=pk)

        if delivery.status != 'assigned':
            return Response(
                {'error': 'Delivery must be in assigned state'},
                status=status.HTTP_400_BAD_REQUEST
            )

        delivery.status = 'in_transit'
        delivery.save()

        log_action('delivery_in_transit', {
            'delivery_id': delivery.id,
            'order_id': delivery.order.id
        }, user=request.user)

        # Notify user
        send_notification(
            user=delivery.order.user,
            notification_type='delivery',
            title='Out for Delivery',
            message='Your order is out for delivery',
            order=delivery.order
        )

        serializer = OrderDeliverySerializer(delivery)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_delivered(self, request, pk=None):
        """Mark delivery as delivered (admin only)"""
        delivery = get_object_or_404(OrderDelivery, id=pk)

        if delivery.status != 'in_transit':
            return Response(
                {'error': 'Delivery must be in transit'},
                status=status.HTTP_400_BAD_REQUEST
            )

        delivery.status = 'delivered'
        delivery.actual_delivery_date = timezone.now().date()
        delivery.save()

        # Update order status
        delivery.order.status = 'Delivered'
        delivery.order.save()

        log_action('delivery_completed', {
            'delivery_id': delivery.id,
            'order_id': delivery.order.id
        }, user=request.user)

        # Notify user
        send_notification(
            user=delivery.order.user,
            notification_type='delivery',
            title='Order Delivered',
            message='Your order has been successfully delivered',
            order=delivery.order
        )

        serializer = OrderDeliverySerializer(delivery)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_failed(self, request, pk=None):
        """Mark delivery attempt as failed (admin only)"""
        delivery = get_object_or_404(OrderDelivery, id=pk)

        delivery.delivery_attempts += 1
        delivery.last_delivery_attempt = timezone.now()

        if delivery.delivery_attempts >= 3:
            delivery.status = 'failed'
            message = 'Multiple delivery attempts failed. Please reschedule.'
        else:
            message = f'Delivery attempt failed. Retry scheduled.'
            delivery.status = 'in_transit'

        delivery.save()

        log_action('delivery_failed_attempt', {
            'delivery_id': delivery.id,
            'attempt': delivery.delivery_attempts
        }, user=request.user)

        # Notify user
        send_notification(
            user=delivery.order.user,
            notification_type='alert',
            title='Delivery Attempt Failed',
            message=message,
            order=delivery.order
        )

        serializer = OrderDeliverySerializer(delivery)
        return Response(serializer.data)


# ============= PRESCRIPTION VERIFICATION VIEWS =============
class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    Prescription management and verification
    """
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

    def get_permissions(self):
        if self.action in ['verify', 'list_pending']:
            return [permissions.IsAdminUser()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['create', 'upload']:
            return [permissions.IsAuthenticated()]
        else:
            return [permissions.IsAdminUser()]

    def list(self, request):
        """Get user's prescriptions"""
        prescriptions = Prescription.objects.filter(user=request.user)
        serializer = PrescriptionSerializer(prescriptions, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Upload new prescription"""
        serializer = PrescriptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            log_action('prescription_uploaded', {
                'prescription_id': serializer.instance.id
            }, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def verify(self, request, pk=None):
        """Verify prescription (admin/pharmacist only)"""
        prescription = self.get_object()

        if prescription.status != 'Pending':
            return Response(
                {'error': f'Cannot verify prescription with status {prescription.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        prescription.status = 'Verified'
        prescription.is_verified = True
        prescription.assigned_pharmacist = request.user
        prescription.save()

        log_action('prescription_verified', {
            'prescription_id': prescription.id
        }, user=request.user)

        # Notify user
        send_notification(
            user=prescription.user,
            notification_type='prescription_verified',
            title='Prescription Verified',
            message='Your prescription has been verified and approved'
        )

        serializer = PrescriptionSerializer(prescription)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Reject prescription (admin/pharmacist only)"""
        prescription = self.get_object()

        if prescription.status != 'Pending':
            return Response(
                {'error': f'Cannot reject prescription with status {prescription.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        prescription.status = 'Rejected'
        rejection_reason = request.data.get('reason', 'Prescription could not be verified')
        prescription.save()

        log_action('prescription_rejected', {
            'prescription_id': prescription.id,
            'reason': rejection_reason
        }, user=request.user)

        # Notify user
        send_notification(
            user=prescription.user,
            notification_type='alert',
            title='Prescription Not Verified',
            message=f'Reason: {rejection_reason}'
        )

        serializer = PrescriptionSerializer(prescription)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def pending(self, request):
        """Get all pending prescriptions for verification"""
        pending = Prescription.objects.filter(status='Pending')
        serializer = PrescriptionSerializer(pending, many=True)
        return Response(serializer.data)
