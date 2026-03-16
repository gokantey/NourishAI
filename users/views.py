import random
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.forms import AuthenticationForm, SetPasswordForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.tokens import default_token_generator
from django.contrib import messages
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .forms import (
    RegisterForm, OnboardingStep1Form,
    OnboardingStep2Form, OnboardingStep3Form,
    ProfileUpdateForm
)
from .models import UserProfile
from emails import send_welcome_email

User = get_user_model()

OTP_EXPIRY_MINUTES = 10


# ─── Helpers ──────────────────────────────────────────────────────────────────

def cleanup_old_plans(user):
    from meals.models import MealPlan
    cutoff = timezone.now() - timedelta(days=7)
    MealPlan.objects.filter(
        user_profile=user.profile,
        is_saved=False,
        created_at__lt=cutoff
    ).delete()


def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_email(email, otp, first_name):
    send_mail(
        subject='Verify your NourishAI account',
        message=(
            f'Hi {first_name},\n\n'
            f'Welcome to NourishAI! Use the code below to verify your email address.\n\n'
            f'Your verification code: {otp}\n\n'
            f'This code expires in {OTP_EXPIRY_MINUTES} minutes.\n\n'
            f'If you did not create a NourishAI account, please ignore this email.\n\n'
            f'— The NourishAI Team'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


# ─── Registration & OTP ───────────────────────────────────────────────────────

def register_view(request):
    if request.user.is_authenticated:
        return redirect('meals:dashboard')

    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            otp = generate_otp()
            request.session['pending_registration'] = {
                'username': form.cleaned_data['username'],
                'email': form.cleaned_data['email'],
                'first_name': form.cleaned_data['first_name'],
                'last_name': form.cleaned_data['last_name'],
                'password': form.cleaned_data['password1'],
                'otp': otp,
                'otp_created_at': timezone.now().isoformat(),
            }
            try:
                send_otp_email(
                    email=form.cleaned_data['email'],
                    otp=otp,
                    first_name=form.cleaned_data['first_name'],
                )
            except Exception as e:
                messages.error(request, f'Failed to send verification email: {str(e)}')
                return render(request, 'users/register.html', {'form': form})
            return redirect('users:verify_otp')
    else:
        form = RegisterForm()

    return render(request, 'users/register.html', {'form': form})


def verify_otp_view(request):
    if request.user.is_authenticated:
        return redirect('meals:dashboard')

    pending = request.session.get('pending_registration')
    if not pending:
        messages.error(request, 'No pending registration found. Please register again.')
        return redirect('users:register')

    email = pending.get('email', '')
    masked_email = email[:2] + '***' + email[email.index('@'):]

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'resend':
            new_otp = generate_otp()
            pending['otp'] = new_otp
            pending['otp_created_at'] = timezone.now().isoformat()
            request.session['pending_registration'] = pending
            request.session.modified = True
            try:
                send_otp_email(email=pending['email'], otp=new_otp, first_name=pending['first_name'])
                messages.success(request, 'A new verification code has been sent to your email.')
            except Exception as e:
                messages.error(request, f'Failed to resend code: {str(e)}')
            return redirect('users:verify_otp')

        entered_otp = request.POST.get('otp', '').strip()
        stored_otp = pending.get('otp')
        otp_created_at = pending.get('otp_created_at')

        from datetime import datetime
        created_at = datetime.fromisoformat(otp_created_at)
        if created_at.tzinfo is None:
            from django.utils.timezone import make_aware
            created_at = make_aware(created_at)
        expiry = created_at + timedelta(minutes=OTP_EXPIRY_MINUTES)

        if timezone.now() > expiry:
            return render(request, 'users/verify_otp.html', {'masked_email': masked_email, 'error': 'expired'})

        if entered_otp != stored_otp:
            return render(request, 'users/verify_otp.html', {'masked_email': masked_email, 'error': 'invalid'})

        try:
            user = User.objects.create_user(
                username=pending['username'],
                email=pending['email'],
                first_name=pending['first_name'],
                last_name=pending['last_name'],
                password=pending['password'],
            )
            UserProfile.objects.get_or_create(user=user)
            del request.session['pending_registration']
            request.session.modified = True
            login(request, user)
            # ── Send welcome email ──
            send_welcome_email(user)
            messages.success(request, f'Welcome to NourishAI, {user.first_name}! Let\'s set up your profile.')
            return redirect('users:onboarding_step1')
        except Exception as e:
            messages.error(request, f'Error creating account: {str(e)}')
            return redirect('users:register')

    return render(request, 'users/verify_otp.html', {'masked_email': masked_email, 'error': None})


# ─── Login / Logout ───────────────────────────────────────────────────────────

def login_view(request):
    if request.user.is_authenticated:
        return redirect('meals:dashboard')
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            profile, created = UserProfile.objects.get_or_create(user=user)
            if not profile.onboarding_complete:
                return redirect('users:onboarding_step1')
            cleanup_old_plans(user)
            return redirect('meals:dashboard')
        messages.error(request, 'Invalid username or password. Please try again.')
    else:
        form = AuthenticationForm()
    return render(request, 'users/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('users:login')


# ─── Forgot Password ──────────────────────────────────────────────────────────

def forgot_password_view(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        if email:
            try:
                user = User.objects.get(email__iexact=email)
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                reset_link = request.build_absolute_uri(f'/users/reset-password/{uid}/{token}/')
                send_mail(
                    subject='Reset your NourishAI password',
                    message=(
                        f'Hi {user.first_name},\n\n'
                        f'Click the link below to reset your password. This link expires in 24 hours.\n\n'
                        f'{reset_link}\n\n'
                        f'If you did not request this, please ignore this email.\n\n'
                        f'— The NourishAI Team'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except User.DoesNotExist:
                pass
        return redirect('users:forgot_password_done')
    return render(request, 'users/forgot_password.html')


def forgot_password_done_view(request):
    return render(request, 'users/forgot_password_done.html')


def reset_password_view(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is None or not default_token_generator.check_token(user, token):
        return render(request, 'users/reset_password_invalid.html')

    if request.method == 'POST':
        form = SetPasswordForm(user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your password has been reset. You can now log in.')
            return redirect('users:reset_password_complete')
    else:
        form = SetPasswordForm(user)

    return render(request, 'users/reset_password.html', {'form': form, 'uidb64': uidb64, 'token': token})


def reset_password_complete_view(request):
    return render(request, 'users/reset_password_complete.html')


# ─── Onboarding ───────────────────────────────────────────────────────────────

@login_required
def onboarding_step1(request):
    profile = request.user.profile
    if request.method == 'POST':
        form = OnboardingStep1Form(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('users:onboarding_step2')
    else:
        form = OnboardingStep1Form(instance=profile)
    return render(request, 'users/onboarding_step1.html', {'form': form, 'step': 1})


@login_required
def onboarding_step2(request):
    profile = request.user.profile
    if request.method == 'POST':
        form = OnboardingStep2Form(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('users:onboarding_step3')
    else:
        form = OnboardingStep2Form(instance=profile)
    return render(request, 'users/onboarding_step2.html', {'form': form, 'step': 2})


@login_required
def onboarding_step3(request):
    profile = request.user.profile
    if request.method == 'POST':
        form = OnboardingStep3Form(request.POST, instance=profile)
        if form.is_valid():
            profile = form.save(commit=False)
            profile.onboarding_complete = True
            profile.save()
            messages.success(request, "Profile complete! Let's generate your first meal plan.")
            return redirect('meals:dashboard')
    else:
        form = OnboardingStep3Form(instance=profile)
    return render(request, 'users/onboarding_step3.html', {'form': form, 'step': 3})


@login_required
def profile_view(request):
    profile = request.user.profile
    if request.method == 'POST':
        form = ProfileUpdateForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully.')
            return redirect('meals:dashboard')
    else:
        form = ProfileUpdateForm(instance=profile)

    goal_estimate = profile.calculate_goal_estimate()
    return render(request, 'users/profile.html', {'form': form, 'profile': profile, 'goal_estimate': goal_estimate})