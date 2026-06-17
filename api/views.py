import secrets
import hashlib
import hmac
import json
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.db import models as db_models

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

# ── Custom throttle scopes ────────────────────────────────────────────────────
class LoginThrottle(AnonRateThrottle):
    scope = 'login'

class OTPThrottle(AnonRateThrottle):
    scope = 'otp'

class GenerateThrottle(UserRateThrottle):
    scope = 'generate'

from users.models import UserProfile
from meals.models import MealPlan, Meal, ShoppingList, ShoppingListItem, Notification
from meals.groq_service import generate_meal_plan, regenerate_single_meal
from emails import (
    send_welcome_email, send_premium_upgrade_email,
    send_cancellation_email, send_payment_failed_email, send_save_limit_email,
)
from notifications import (
    notify_plan_generated, notify_plan_saved, notify_upgrade,
    notify_cancelled, notify_payment_failed, notify_save_limit,
)
from .serializers import (
    UserProfileSerializer, UserProfileUpdateSerializer,
    OnboardingStep1Serializer, OnboardingStep2Serializer, OnboardingStep3Serializer,
    MealPlanSerializer, MealPlanListSerializer, MealSerializer,
    RegisterSerializer, VerifyOTPSerializer, RateMealSerializer, SavePlanSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
)
import requests as http_requests
import os

User = get_user_model()
OTP_EXPIRY_MINUTES = 2
PARTIAL_DAYS = ['monday', 'tuesday', 'wednesday']
ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def cleanup_old_plans(user):
    cutoff = timezone.now() - timedelta(days=7)
    MealPlan.objects.filter(
        user_profile=user.profile,
        is_saved=False,
        created_at__lt=cutoff
    ).delete()


# ─── Health check ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def health_view(request):
    """Simple public health check endpoint to wake up Render container on page load."""
    return Response({'status': 'healthy'}, status=status.HTTP_200_OK)


# ─── Auth ─────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([LoginThrottle])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    username = serializer.validated_data['username']

    # Clean up any existing inactive user with same email or username first
    User.objects.filter(email__iexact=email, is_active=False).delete()
    User.objects.filter(username__iexact=username, is_active=False).delete()

    # Create user with is_active=False
    user = User.objects.create_user(
        username=username,
        email=email,
        first_name=serializer.validated_data['first_name'],
        last_name=serializer.validated_data['last_name'],
        password=serializer.validated_data['password'],
    )
    user.is_active = False
    user.save()

    # Generate OTP
    otp = str(secrets.randbelow(900000) + 100000)
    profile = user.profile
    profile.otp = otp
    profile.otp_created_at = timezone.now()
    profile.save()

    # Save to session as fallback for legacy frontends
    request.session['pending_registration'] = {
        'username': username,
        'email': email,
        'first_name': serializer.validated_data['first_name'],
        'last_name': serializer.validated_data['last_name'],
        'password': serializer.validated_data['password'],
        'otp': otp,
        'otp_created_at': timezone.now().isoformat(),
    }
    request.session.modified = True

    email_sent = True
    _email_error = None
    try:
        send_mail(
            subject='Verify your NourishAI account',
            message=(
                f'Hi {serializer.validated_data["first_name"]},\n\n'
                f'Your verification code: {otp}\n\n'
                f'This code expires in {OTP_EXPIRY_MINUTES} minutes.\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        email_sent = False
        _email_error = e
        import logging
        logging.getLogger(__name__).error(f'Email send failed: {e}')

    masked = email[:2] + '***' + email[email.index('@'):]
    response_data = {'message': 'Verification code sent.', 'masked_email': masked}
    if not email_sent:
        response_data['dev_otp'] = otp
        response_data['email_error'] = str(_email_error)
        response_data['message'] = 'Email sending failed — use dev_otp below to verify.'
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([OTPThrottle])
def verify_otp_view(request):
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data.get('email')
    entered_otp = serializer.validated_data['otp']

    pending = request.session.get('pending_registration')

    # 1. Fallback to session if email is not passed in the request
    if not email and pending:
        email = pending.get('email')
        stored_otp = pending.get('otp')
        otp_created_at_str = pending.get('otp_created_at')

        if not stored_otp or not otp_created_at_str:
            return Response({'error': 'invalid'}, status=status.HTTP_400_BAD_REQUEST)

        created_at = datetime.fromisoformat(otp_created_at_str)
        if created_at.tzinfo is None:
            from django.utils.timezone import make_aware
            created_at = make_aware(created_at)

        if timezone.now() > created_at + timedelta(minutes=OTP_EXPIRY_MINUTES):
            return Response({'error': 'expired'}, status=status.HTTP_400_BAD_REQUEST)

        if entered_otp != stored_otp:
            return Response({'error': 'invalid'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if user already exists from db-save during register
            user = User.objects.filter(email__iexact=email, is_active=False).first()
            if not user:
                user = User.objects.create_user(
                    username=pending['username'],
                    email=pending['email'],
                    first_name=pending['first_name'],
                    last_name=pending['last_name'],
                    password=pending['password'],
                )
            user.is_active = True
            user.save()

            # Clean session
            del request.session['pending_registration']
            request.session.modified = True

            send_welcome_email(user)
            tokens = get_tokens_for_user(user)
            return Response({
                'message': f'Welcome to NourishAI, {user.first_name}!',
                'tokens': tokens,
                'user': {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username, 'email': user.email},
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 2. Database-backed verification
    if not email:
        return Response({'error': 'No pending registration. Please register again.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email, is_active=False)
    except User.DoesNotExist:
        return Response({'error': 'No pending registration. Please register again.'}, status=status.HTTP_400_BAD_REQUEST)

    profile = user.profile
    stored_otp = profile.otp
    otp_created_at = profile.otp_created_at

    if not stored_otp or not otp_created_at:
        return Response({'error': 'invalid'}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > otp_created_at + timedelta(minutes=OTP_EXPIRY_MINUTES):
        return Response({'error': 'expired'}, status=status.HTTP_400_BAD_REQUEST)

    if entered_otp != stored_otp:
        return Response({'error': 'invalid'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user.is_active = True
        user.save()
        profile.otp = None
        profile.otp_created_at = None
        profile.save()

        # Clean session if it exists
        if 'pending_registration' in request.session:
            del request.session['pending_registration']
            request.session.modified = True

        send_welcome_email(user)
        tokens = get_tokens_for_user(user)
        return Response({
            'message': f'Welcome to NourishAI, {user.first_name}!',
            'tokens': tokens,
            'user': {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username, 'email': user.email},
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([OTPThrottle])
def resend_otp_view(request):
    pending = request.session.get('pending_registration')
    email = request.data.get('email')

    # 1. Fallback to session resend if email is missing
    if not email and pending:
        new_otp = str(secrets.randbelow(900000) + 100000)
        pending['otp'] = new_otp
        pending['otp_created_at'] = timezone.now().isoformat()
        request.session['pending_registration'] = pending
        request.session.modified = True

        try:
            # Keep UserProfile sync'd if it exists
            user = User.objects.filter(email__iexact=pending['email'], is_active=False).first()
            if user:
                profile = user.profile
                profile.otp = new_otp
                profile.otp_created_at = timezone.now()
                profile.save()

            send_mail(
                subject='Your new NourishAI verification code',
                message=(
                    f'Hi {pending["first_name"]},\n\n'
                    f'Your new verification code: {new_otp}\n\n'
                    f'This code expires in {OTP_EXPIRY_MINUTES} minutes.\n\n'
                    f'— The NourishAI Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[pending['email']],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'New code sent.'}, status=status.HTTP_200_OK)

    # 2. Database resend
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email, is_active=False)
    except User.DoesNotExist:
        return Response({'error': 'No pending registration.'}, status=status.HTTP_400_BAD_REQUEST)

    new_otp = str(secrets.randbelow(900000) + 100000)
    profile = user.profile
    profile.otp = new_otp
    profile.otp_created_at = timezone.now()
    profile.save()

    try:
        send_mail(
            subject='Your new NourishAI verification code',
            message=(
                f'Hi {user.first_name},\n\n'
                f'Your new verification code: {new_otp}\n\n'
                f'This code expires in {OTP_EXPIRY_MINUTES} minutes.\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f'Email send failed: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': 'New code sent.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([LoginThrottle])
def login_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if not user:
        # Check if credentials are correct but account is suspended (is_active=False)
        from django.contrib.auth import get_user_model as _get_user_model
        _User = _get_user_model()
        try:
            _u = _User.objects.get(username=username)
            if not _u.is_active and _u.check_password(password):
                return Response(
                    {'error': 'Your account has been suspended. Please contact support.', 'error_code': 'account_suspended'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except _User.DoesNotExist:
            pass
        return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    profile, _ = UserProfile.objects.get_or_create(user=user)
    cleanup_old_plans(user)
    tokens = get_tokens_for_user(user)

    return Response({
        'tokens': tokens,
        'user': {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'email': user.email,
        },
        'onboarding_complete': profile.onboarding_complete,
        'subscription_tier': profile.subscription_tier,
        'has_password': user.has_usable_password(),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([LoginThrottle])
def google_auth_view(request):
    """
    Receives a Google id_token from the frontend (after Google popup sign-in).
    Verifies it with Google, then either creates a new user or logs in the existing one.
    Returns JWT tokens + user info just like login_view.
    """
    import requests as http_requests

    id_token = request.data.get('id_token', '').strip()
    if not id_token:
        return Response({'error': 'id_token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify token with Google
    google_resp = http_requests.get(
        'https://oauth2.googleapis.com/tokeninfo',
        params={'id_token': id_token},
        timeout=10,
    )
    if google_resp.status_code != 200:
        return Response({'error': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

    payload = google_resp.json()

    # Verify the token was issued for our app
    client_id = settings.GOOGLE_CLIENT_ID
    if client_id and payload.get('aud') != client_id:
        return Response({'error': 'Token audience mismatch.'}, status=status.HTTP_400_BAD_REQUEST)

    email = payload.get('email', '').lower()
    first_name = payload.get('given_name', '')
    last_name = payload.get('family_name', '')
    google_id = payload.get('sub', '')

    if not email:
        return Response({'error': 'Google account has no email.'}, status=status.HTTP_400_BAD_REQUEST)

    # Find or create user
    user, created = User.objects.get_or_create(
        email__iexact=email,
        defaults={
            'username': email.split('@')[0],
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
        }
    )

    if created:
        # Make sure username is unique
        base = email.split('@')[0]
        username = base
        counter = 1
        while User.objects.filter(username=username).exclude(pk=user.pk).exists():
            username = f'{base}{counter}'
            counter += 1
        user.username = username
        user.set_unusable_password()  # Google users don't have a password
        user.save()

        # Create profile
        UserProfile.objects.get_or_create(user=user)

        from emails import send_welcome_email
        send_welcome_email(user)

    if not user.is_active:
        return Response(
            {'error': 'Your account has been suspended. Contact team.nourishai@gmail.com.', 'error_code': 'account_suspended'},
            status=status.HTTP_403_FORBIDDEN
        )

    profile, _ = UserProfile.objects.get_or_create(user=user)
    tokens = get_tokens_for_user(user)

    return Response({
        'tokens': tokens,
        'user': {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'email': user.email,
        },
        'onboarding_complete': profile.onboarding_complete,
        'subscription_tier': profile.subscription_tier,
        'has_password': user.has_usable_password(),
        'is_new_user': created,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def forgot_password_view(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    try:
        user = User.objects.get(email__iexact=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        reset_link = f'{frontend_url}/reset-password/{uid}/{token}'
        send_mail(
            subject='Reset your NourishAI password',
            message=(
                f'Hi {user.first_name},\n\n'
                f'Click the link below to reset your password. Expires in 24 hours.\n\n'
                f'{reset_link}\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except User.DoesNotExist:
        pass

    return Response({'message': 'If that email exists, a reset link has been sent.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def reset_password_view(request):
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, serializer.validated_data['token']):
        return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)


# ─── Profile ──────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile = request.user.profile
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def profile_update_view(request):
    profile = request.user.profile
    serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(UserProfileSerializer(profile).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    """Requires password confirmation. Google OAuth users confirm with their email instead."""
    user = request.user
    password = request.data.get('password', '')

    if not password:
        return Response({'error': 'Password is required to delete your account.'}, status=status.HTTP_400_BAD_REQUEST)

    if user.has_usable_password():
        # Regular email/password account — verify password
        if not user.check_password(password):
            return Response({'error': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        # Google OAuth account — no password set, verify by email address instead
        if password.lower() != user.email.lower():
            return Response({'error': 'Please enter your email address to confirm deletion.'}, status=status.HTTP_400_BAD_REQUEST)

    user.delete()  # CASCADE deletes profile, plans, meals, notifications, streak, etc.
    return Response({'message': 'Account deleted.'}, status=status.HTTP_200_OK)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_step1(request):
    profile = request.user.profile
    serializer = OnboardingStep1Serializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Step 1 saved.', 'next': 'step2'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_step2(request):
    profile = request.user.profile
    serializer = OnboardingStep2Serializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Step 2 saved.', 'next': 'step3'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_step3(request):
    profile = request.user.profile
    serializer = OnboardingStep3Serializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        profile.onboarding_complete = True
        profile.save()
        return Response({'message': 'Onboarding complete!', 'onboarding_complete': True})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Meal Plans ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    profile = request.user.profile
    cutoff = timezone.now() - timedelta(days=7)

    latest_plan = MealPlan.objects.filter(
        user_profile=profile
    ).filter(
        db_models.Q(is_saved=True) | db_models.Q(created_at__gte=cutoff)
    ).order_by('-created_at').first()

    saved_plans = MealPlan.objects.filter(
        user_profile=profile, is_saved=True
    ).order_by('-created_at')

    goal_estimate = profile.calculate_goal_estimate()

    return Response({
        'profile': UserProfileSerializer(profile).data,
        'latest_plan': MealPlanSerializer(latest_plan).data if latest_plan else None,
        'saved_plans': MealPlanListSerializer(saved_plans, many=True).data,
        'goal_estimate': goal_estimate,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([GenerateThrottle])
def generate_plan_view(request):
    profile = request.user.profile
    gen_status = profile.get_generation_status()

    if not gen_status['allowed']:
        return Response({
            'error': 'Generation limit reached.',
            'gen_status': gen_status,
            'upgrade_required': True,
        }, status=status.HTTP_403_FORBIDDEN)

    is_premium = (
        profile.subscription_tier == 'premium'
        or request.user.is_staff
        or request.user.is_superuser
    )

    liked_meals = []
    disliked_meals = []
    if is_premium:
        liked_meals = list(
            Meal.objects.filter(meal_plan__user_profile=profile, rating__gte=4)
            .values_list('title', flat=True).distinct()[:10]
        )
        disliked_meals = list(
            Meal.objects.filter(meal_plan__user_profile=profile, rating__lte=2)
            .values_list('title', flat=True).distinct()[:10]
        )

    try:
        is_partial = gen_status['type'] == 'partial'
        data = generate_meal_plan(profile, liked_meals=liked_meals, disliked_meals=disliked_meals)

        meal_plan = MealPlan.objects.create(
            user_profile=profile,
            week_start_date=timezone.now().date(),
            is_partial=is_partial,
        )

        for day_data in data['meal_plan']:
            if is_partial and day_data['day'] not in PARTIAL_DAYS:
                continue
            for meal_data in day_data['meals']:
                Meal.objects.create(
                    meal_plan=meal_plan,
                    day=day_data['day'],
                    meal_type=meal_data['meal_type'],
                    title=meal_data['title'],
                    description=meal_data['description'],
                    ingredients=meal_data['ingredients'],
                    instructions=meal_data['instructions'],
                    prep_time=meal_data.get('prep_time', 0),
                    difficulty=meal_data.get('difficulty', 'easy'),
                    calories=meal_data.get('calories', 0),
                    protein=meal_data.get('protein', 0),
                    carbohydrates=meal_data.get('carbohydrates', 0),
                    fats=meal_data.get('fats', 0),
                    fibre=meal_data.get('fibre', 0),
                    sugar=meal_data.get('sugar', 0),
                    sodium=meal_data.get('sodium', 0),
                    portion_guide=meal_data.get('portion_guide', ''),
                    suggested_time=meal_data.get('suggested_time', ''),
                )

        shopping_list = ShoppingList.objects.create(meal_plan=meal_plan)
        for item in data['shopping_list']:
            ShoppingListItem.objects.create(
                shopping_list=shopping_list,
                ingredient_name=item['ingredient_name'],
                quantity=item['quantity'],
                unit=item.get('unit', ''),
                category=item.get('category', 'pantry'),
            )

        profile.increment_generation_count()
        notify_plan_generated(request.user, is_partial=is_partial)

        return Response({
            'message': '3-day preview ready! Upgrade for the full 7-day plan.' if is_partial else 'Meal plan ready!',
            'meal_plan': MealPlanSerializer(meal_plan).data,
            'is_partial': is_partial,
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def meal_plan_detail_view(request, pk):
    try:
        meal_plan = MealPlan.objects.get(pk=pk, user_profile=request.user.profile)
    except MealPlan.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    profile = request.user.profile
    is_premium = (
        profile.subscription_tier == 'premium'
        or request.user.is_staff
        or request.user.is_superuser
    )

    data = MealPlanSerializer(meal_plan).data
    data['show_lock'] = meal_plan.is_partial and not is_premium
    data['locked_days'] = ['thursday', 'friday', 'saturday', 'sunday']
    data['can_save'] = profile.can_save_plan()[0]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def meal_plan_history_view(request):
    profile = request.user.profile
    cutoff = timezone.now() - timedelta(days=7)
    plans = MealPlan.objects.filter(
        user_profile=profile
    ).filter(
        db_models.Q(is_saved=True) | db_models.Q(created_at__gte=cutoff)
    ).order_by('-created_at')
    return Response(MealPlanListSerializer(plans, many=True).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_plan_view(request, pk):
    try:
        meal_plan = MealPlan.objects.get(pk=pk, user_profile=request.user.profile)
        meal_plan.delete()
        return Response({'message': 'Plan deleted.'})
    except MealPlan.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_plan_view(request, pk):
    try:
        meal_plan = MealPlan.objects.get(pk=pk, user_profile=request.user.profile)
    except MealPlan.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SavePlanSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    can_save, reason = request.user.profile.can_save_plan()
    if not can_save:
        send_save_limit_email(request.user)
        notify_save_limit(request.user)
        return Response({'error': reason, 'upgrade_required': True}, status=status.HTTP_403_FORBIDDEN)

    title = serializer.validated_data.get('title', '').strip()
    meal_plan.title = title if title else f"Plan — {meal_plan.week_start_date.strftime('%d %b %Y')}"
    meal_plan.is_saved = True
    meal_plan.save()
    notify_plan_saved(request.user, meal_plan.title)
    return Response({'message': f'Saved as "{meal_plan.title}".', 'meal_plan': MealPlanListSerializer(meal_plan).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsave_plan_view(request, pk):
    try:
        meal_plan = MealPlan.objects.get(pk=pk, user_profile=request.user.profile)
        meal_plan.is_saved = False
        meal_plan.save()
        return Response({'message': 'Plan unsaved.'})
    except MealPlan.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_meal_view(request, pk):
    try:
        meal = Meal.objects.get(pk=pk, meal_plan__user_profile=request.user.profile)
    except Meal.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        profile = request.user.profile
        existing = list(meal.meal_plan.meals.exclude(pk=meal.pk).values_list('title', flat=True))
        data = regenerate_single_meal(profile, meal.day, meal.meal_type, existing)
        meal_data = data.get('meal') or data.get('meals', [None])[0] or data
        meal.title = meal_data['title']
        meal.description = meal_data['description']
        meal.ingredients = meal_data['ingredients']
        meal.instructions = meal_data['instructions']
        meal.prep_time = meal_data.get('prep_time', 0)
        meal.difficulty = meal_data.get('difficulty', 'easy')
        meal.calories = meal_data.get('calories', 0)
        meal.protein = meal_data.get('protein', 0)
        meal.carbohydrates = meal_data.get('carbohydrates', 0)
        meal.fats = meal_data.get('fats', 0)
        meal.fibre = meal_data.get('fibre', 0)
        meal.sugar = meal_data.get('sugar', 0)
        meal.sodium = meal_data.get('sodium', 0)
        meal.portion_guide = meal_data.get('portion_guide', '')
        meal.suggested_time = meal_data.get('suggested_time', '')
        meal.rating = None
        meal.save()
        return Response({'message': 'Meal swapped!', 'meal': MealSerializer(meal).data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_meal_view(request, pk):
    try:
        meal = Meal.objects.get(pk=pk, meal_plan__user_profile=request.user.profile)
    except Meal.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = RateMealSerializer(data=request.data)
    if serializer.is_valid():
        meal.rating = serializer.validated_data['rating']
        meal.save()
        return Response({'message': f'Rated {meal.title} {meal.rating}/5.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Upgrade / Paystack ───────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_view(request):
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        callback_url = os.getenv('PAYSTACK_CALLBACK_URL', f'{frontend_url}/upgrade/success')

        response = http_requests.post(
            'https://api.paystack.co/transaction/initialize',
            headers={
                'Authorization': f'Bearer {os.getenv("PAYSTACK_SECRET_KEY")}',
                'Content-Type': 'application/json',
            },
            json={
                'email': request.user.email,
                'amount': 2000,
                'callback_url': callback_url,
                'metadata': {'user_id': request.user.id, 'plan': 'premium'}
            }
        )
        data = response.json()
        if data.get('status'):
            return Response({'authorization_url': data['data']['authorization_url']})
        return Response({'error': data.get('message', 'Payment initialization failed.')}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upgrade_success_view(request):
    reference = request.query_params.get('reference')
    if not reference:
        return Response({'error': 'No reference provided.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        response = http_requests.get(
            f'https://api.paystack.co/transaction/verify/{reference}',
            headers={'Authorization': f'Bearer {os.getenv("PAYSTACK_SECRET_KEY")}'}
        )
        data = response.json()
        if data.get('status') and data['data']['status'] == 'success':
            profile = request.user.profile
            profile.subscription_tier = 'premium'
            profile.paystack_customer_id = str(data['data']['customer']['id'])
            profile.save()
            send_premium_upgrade_email(request.user)
            notify_upgrade(request.user)
            return Response({'message': 'Upgraded to Premium!', 'subscription_tier': 'premium'})
        return Response({'error': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription_view(request):
    profile = request.user.profile
    try:
        if profile.paystack_subscription_code:
            http_requests.post(
                'https://api.paystack.co/subscription/disable',
                headers={
                    'Authorization': f'Bearer {os.getenv("PAYSTACK_SECRET_KEY")}',
                    'Content-Type': 'application/json',
                },
                json={
                    'code': profile.paystack_subscription_code,
                    'token': profile.paystack_customer_id,
                }
            )
        profile.subscription_tier = 'free'
        profile.paystack_subscription_code = None
        profile.save()
        try:
            send_cancellation_email(request.user)
        except Exception as email_err:
            print(f'[NourishAI] Cancellation email failed: {email_err}')
        notify_cancelled(request.user)
        return Response({'message': 'Subscription cancelled.', 'subscription_tier': 'free'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
def paystack_webhook(request):
    if request.method != 'POST':
        return HttpResponse(status=405)

    paystack_secret = os.getenv('PAYSTACK_SECRET_KEY', '')
    signature = request.headers.get('X-Paystack-Signature', '')
    body = request.body

    expected = hmac.new(paystack_secret.encode('utf-8'), body, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return HttpResponse(status=401)

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return HttpResponse(status=400)

    event = payload.get('event')
    data = payload.get('data', {})
    email = data.get('customer', {}).get('email')

    if not email:
        return HttpResponse(status=200)

    try:
        user = User.objects.get(email__iexact=email)
        profile = user.profile

        if event == 'charge.success':
            profile.subscription_tier = 'premium'
            profile.save()

        elif event == 'subscription.create':
            profile.subscription_tier = 'premium'
            profile.paystack_subscription_code = data.get('subscription_code', '')
            profile.save()

        elif event == 'subscription.disable':
            profile.subscription_tier = 'free'
            profile.paystack_subscription_code = None
            profile.save()

        elif event == 'invoice.payment_failed':
            profile.subscription_tier = 'free'
            profile.paystack_subscription_code = None
            profile.save()
            send_payment_failed_email(user)

    except User.DoesNotExist:
        pass

    return HttpResponse(status=200)


# ─── Notifications ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_view(request):
    notifs = Notification.objects.filter(user=request.user)[:30]
    unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
    data = [{
        'id': n.id,
        'type': n.type,
        'icon': n.icon,
        'title': n.title,
        'message': n.message,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
    } for n in notifs]
    return Response({'notifications': data, 'unread_count': unread_count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read_view(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, user=request.user)
        notif.is_read = True
        notif.save()
        return Response({'message': 'Marked as read.'})
    except Notification.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read_view(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All marked as read.'})

# ── Progress views ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def progress_view(request):
    from progress_service import get_full_progress_data
    data = get_full_progress_data(request.user)
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkin_view(request):
    """
    Submit today's daily checklist.
    Body: { "completed_items": ["followed_plan", "drank_water", ...] }
    """
    from progress_service import submit_checkin, check_and_award_achievements
    from notifications import notify_streak_milestone, notify_achievement

    completed_items = request.data.get('completed_items', [])
    if not isinstance(completed_items, list):
        return Response({'error': 'completed_items must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

    checkin, streak, is_new_consistent = submit_checkin(request.user, completed_items)
    newly_unlocked = check_and_award_achievements(request.user)

    MILESTONE_LABELS = {7: 'Starter', 30: 'Disciplined', 90: 'Elite'}
    if is_new_consistent and streak.current_streak in MILESTONE_LABELS:
        notify_streak_milestone(request.user, streak.current_streak, MILESTONE_LABELS[streak.current_streak])

    for achievement in newly_unlocked:
        notify_achievement(request.user, achievement['name'], achievement['description'])

    return Response({
        'checkin': {
            'date': checkin.date.isoformat(),
            'completed_items': checkin.completed_items,
            'items_completed': checkin.items_completed,
            'is_consistent': checkin.is_consistent,
        },
        'streak': {'current': streak.current_streak, 'longest': streak.longest_streak},
        'is_new_consistent_day': is_new_consistent,
        'newly_unlocked': newly_unlocked,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_checklist_prefs_view(request):
    """Save the user's active checklist item keys."""
    from progress_service import DEFAULT_ACTIVE_ITEMS
    items = request.data.get('items', [])
    if not isinstance(items, list) or len(items) < 2:
        return Response({'error': 'Please select at least 2 checklist items.'}, status=status.HTTP_400_BAD_REQUEST)
    valid = [k for k in items if k in DEFAULT_ACTIVE_ITEMS]
    request.user.profile.checklist_items = valid
    request.user.profile.save(update_fields=['checklist_items'])
    return Response({'items': valid})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def use_freeze_view(request):
    from meals.models import StreakRecord
    from progress_service import get_freeze_status
    from datetime import date
    profile = request.user.profile
    if profile.subscription_tier != 'premium' and not request.user.is_staff:
        return Response({'error': 'Streak freeze is a Premium feature.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        streak = request.user.streak
    except StreakRecord.DoesNotExist:
        return Response({'error': 'No streak record found.'}, status=status.HTTP_404_NOT_FOUND)

    # Apply 30-day reset if the window has expired
    streak = get_freeze_status(streak)

    if streak.freeze_tokens <= 0:
        reset_on = streak.freeze_reset_date
        return Response({
            'error': 'No freeze tokens remaining.',
            'freeze_reset_date': reset_on.isoformat() if reset_on else None,
        }, status=status.HTTP_400_BAD_REQUEST)

    # Start the window on first use
    if streak.freeze_reset_date is None:
        streak.freeze_reset_date = date.today()

    streak.freeze_tokens -= 1
    streak.save(update_fields=['freeze_tokens', 'freeze_reset_date'])
    return Response({
        'message': 'Freeze token used.',
        'freeze_tokens': streak.freeze_tokens,
        'freeze_reset_date': streak.freeze_reset_date.isoformat(),
    })


# ── Phase 8: PDF Export & Share Link ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_pdf_view(request, pk):
    """Generate and return a PDF for a meal plan."""
    from django.http import FileResponse
    from meals.models import MealPlan
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from pdf_service import generate_meal_plan_pdf

    try:
        plan = MealPlan.objects.get(pk=pk, user_profile=request.user.profile)
    except MealPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        buf = generate_meal_plan_pdf(plan)
        filename = f"NourishAI_{plan.title or plan.week_start_date}.pdf".replace(' ', '_')
        return FileResponse(buf, as_attachment=True, filename=filename, content_type='application/pdf')
    except Exception as e:
        return Response({'error': f'PDF generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_plan_view(request, pk):
    """Generate a share token for a plan and return the share URL."""
    import uuid
    from meals.models import MealPlan

    try:
        plan = MealPlan.objects.get(pk=pk, user_profile=request.user.profile)
    except MealPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        if not plan.share_token:
            plan.share_token = uuid.uuid4()
            plan.save(update_fields=['share_token'])
    except Exception:
        # Field may not exist yet — run migrations
        return Response({'error': 'Share feature requires migration. Run: python manage.py migrate'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'share_token': str(plan.share_token),
        'share_url': f'/shared/{plan.share_token}',
    })


@api_view(['GET'])
@permission_classes([])
def public_shared_plan_view(request, token):
    """Public endpoint — no auth required. Returns read-only plan data."""
    from meals.models import MealPlan

    try:
        plan = MealPlan.objects.get(share_token=token)
    except MealPlan.DoesNotExist:
        return Response({'error': 'Plan not found or link is invalid.'}, status=status.HTTP_404_NOT_FOUND)

    profile = plan.user_profile
    meals = plan.meals.all().order_by('day', 'meal_type')

    days_order = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    meal_type_order = ['breakfast','lunch','dinner']

    days = {}
    for meal in meals:
        days.setdefault(meal.day, {})
        days[meal.day][meal.meal_type] = {
            'id': meal.id,
            'title': meal.title,
            'description': meal.description,
            'ingredients': meal.ingredients,
            'instructions': meal.instructions,
            'calories': meal.calories,
            'protein': meal.protein,
            'carbohydrates': meal.carbohydrates,
            'fats': meal.fats,
            'fibre': meal.fibre,
            'prep_time': meal.prep_time,
            'difficulty': meal.difficulty,
            'suggested_time': meal.suggested_time,
            'portion_guide': meal.portion_guide,
        }

    schedule = []
    for day in days_order:
        if day in days:
            schedule.append({
                'day': day,
                'meals': {mt: days[day].get(mt) for mt in meal_type_order if days[day].get(mt)},
            })

    # Shopping list
    shopping = {}
    try:
        for item in plan.shopping_list.items.all():
            shopping.setdefault(item.category, []).append({
                'name': item.ingredient_name,
                'quantity': item.quantity,
                'unit': item.unit,
            })
    except Exception:
        pass

    # Nutrition totals
    nutrition = {
        'calories':      sum(m.calories for m in meals),
        'protein':       round(sum(m.protein for m in meals), 1),
        'carbohydrates': round(sum(m.carbohydrates for m in meals), 1),
        'fats':          round(sum(m.fats for m in meals), 1),
        'fibre':         round(sum(m.fibre for m in meals), 1),
    }

    return Response({
        'plan': {
            'id': plan.id,
            'title': plan.title or f'Week of {plan.week_start_date}',
            'week_start_date': str(plan.week_start_date),
            'is_partial': plan.is_partial,
            'created_at': plan.created_at.isoformat(),
        },
        'owner': {
            'name': f'{profile.user.first_name} {profile.user.last_name}',
            'region': profile.region or '',
            'fitness_goal': profile.fitness_goal or '',
        },
        'nutrition_totals': nutrition,
        'schedule': schedule,
        'shopping_list': shopping,
    })


# ── Phase 9: Snack Suggestions + Meal Rebalancing ────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def snacks_view(request, pk):
    """Generate AI snack suggestions for a meal plan."""
    from meals.models import MealPlan
    from meals.groq_service import generate_snacks

    try:
        plan = MealPlan.objects.get(pk=pk, user_profile=request.user.profile)
    except MealPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        snacks = generate_snacks(plan, request.user.profile)
        plan.snacks = snacks
        plan.save(update_fields=['snacks'])
        return Response({'snacks': snacks, 'message': 'Snacks generated successfully!'})
    except Exception as e:
        return Response({'error': f'Failed to generate snacks: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rebalance_view(request, pk):
    """Rebalance a meal plan — adjust portions and swap similar meals to hit macro targets."""
    from meals.models import MealPlan, Meal
    from meals.groq_service import rebalance_meal_plan

    try:
        plan = MealPlan.objects.get(pk=pk, user_profile=request.user.profile)
    except MealPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        updates = rebalance_meal_plan(plan, request.user.profile)
        change_notes = []

        for update in updates:
            meal_id = update.get('id')
            try:
                meal = Meal.objects.get(pk=meal_id, meal_plan=plan)
                meal.title          = update.get('title', meal.title)
                meal.description    = update.get('description', meal.description)
                meal.calories       = update.get('calories', meal.calories)
                meal.protein        = update.get('protein', meal.protein)
                meal.carbohydrates  = update.get('carbohydrates', meal.carbohydrates)
                meal.fats           = update.get('fats', meal.fats)
                meal.fibre          = update.get('fibre', meal.fibre)
                meal.portion_guide  = update.get('portion_guide', meal.portion_guide)
                meal.save()
                if update.get('change_note'):
                    change_notes.append(f"{meal.day.title()} {meal.meal_type}: {update['change_note']}")
            except Meal.DoesNotExist:
                continue

        return Response({
            'message': 'Plan rebalanced successfully!',
            'changes': change_notes,
        })
    except Exception as e:
        return Response({'error': f'Failed to rebalance plan: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)