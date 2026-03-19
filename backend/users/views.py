from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from .serializers import (
    RegisterSerializer, UserSerializer, AddressSerializer, 
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from .models import Address

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def perform_create(self, serializer):
        user = serializer.save()
        # Bypass OTP for development
        user.is_verified = True
        user.save()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            
            # Use console email backend as configured in settings.py
            subject = "Password Reset Request - HealthMeds"
            message = f"Hello {user.username},\n\nYour password reset token is: {token}\n\nUse this token in the app to reset your password."
            
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            
            return Response({"detail": "Reset token sent to email"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # We return 200 even if user doesn't exist for security
            return Response({"detail": "If an account with this email exists, a reset token has been sent."}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            user = User.objects.get(email=email)
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({"detail": "Password has been reset successfully"}, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"detail": "Invalid Request"}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from .serializers import VerifyOTPSerializer
import random
from .models import OTP

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_otp(request):
    username = request.data.get('username')
    try:
        user = User.objects.get(username=username)
        # Generate 6 digit code
        # In a real app, use a service like Twilio
        code = str(random.randint(100000, 999999))
        OTP.objects.create(user=user, code=code)
        
        # Simulate sending SMS
        print(f"\n[SMS SIMULATOR] Sending OTP {code} to {user.phone_number}\n")
        
        return Response({"detail": f"OTP sent successfully to {user.phone_number[:2]}*****{user.phone_number[-2:]}"}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_otp(request):
    serializer = VerifyOTPSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        otp_code = serializer.validated_data['otp_code']
        
        try:
            user = User.objects.get(username=username)
            
            # Special case for Firebase Verification
            if otp_code == 'FIREBASE_VERIFIED':
                user.is_verified = True
                user.save()
                return Response({
                    "detail": "Firebase Verification successful.",
                    "is_verified": True
                }, status=status.HTTP_200_OK)

            # Find the latest unused OTP for this user
            otp_obj = OTP.objects.filter(user=user, code=otp_code, is_used=False).order_by('-created_at').first()
            
            if not otp_obj:
                return Response({"detail": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.is_expired():
                return Response({"detail": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
            
            # OTP is valid!
            otp_obj.is_used = True
            otp_obj.save()
            
            user.is_verified = True
            user.save()
            
            return Response({
                "detail": "OTP verified successfully. You are now authorized.",
                "is_verified": True
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

