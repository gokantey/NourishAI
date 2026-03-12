from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.forms import AuthenticationForm, PasswordResetForm, SetPasswordForm
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

User = get_user_model()


def cleanup_old_plans(user):
    """Deletes unsaved meal plans older than 7 days. Saved plans are never touched."""
    from meals.models import MealPlan
    cutoff = timezone.now() - timedelta(days=7)
    MealPlan.objects.filter(
        user_profile=user.profile,
        is_saved=False,
        created_at__lt=cutoff
    ).delete()


def register_view(request):
    if request.user.is_authenticated:
        return redirect('meals:dashboard')
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            UserProfile.objects.get_or_create(user=user)
            login(request, user)
            messages.success(request, f'Welcome to NourishAI, {user.first_name}!')
            return redirect('users:onboarding_step1')
        # Form errors render automatically via template
    else:
        form = RegisterForm()
    return render(request, 'users/register.html', {'form': form})


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
        # Invalid credentials — form.errors will contain the message
        # We also add a non-field error message for clarity
        messages.error(request, 'Invalid username or password. Please try again.')
    else:
        form = AuthenticationForm()
    return render(request, 'users/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('users:login')


# ─── Forgot Password ──────────────────────────────────────────────────────────

def forgot_password_view(request):
    """Step 1 — user enters their email address."""
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        if email:
            try:
                user = User.objects.get(email__iexact=email)
                # Generate token and uid
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                reset_link = request.build_absolute_uri(
                    f'/users/reset-password/{uid}/{token}/'
                )
                # Send reset email
                send_mail(
                    subject='Reset your NourishAI password',
                    message=f'Hi {user.first_name},\n\nClick the link below to reset your password. This link expires in 24 hours.\n\n{reset_link}\n\nIf you did not request this, please ignore this email.\n\n— The NourishAI Team',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except User.DoesNotExist:
                # Don't reveal whether the email exists — show the same message either way
                pass
        # Always redirect to confirmation page regardless of whether email exists
        return redirect('users:forgot_password_done')
    return render(request, 'users/forgot_password.html')


def forgot_password_done_view(request):
    """Step 2 — confirmation page after submitting email."""
    return render(request, 'users/forgot_password_done.html')


def reset_password_view(request, uidb64, token):
    """Step 3 — user clicks link from email and sets new password."""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    # Validate token
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

    return render(request, 'users/reset_password.html', {
        'form': form,
        'uidb64': uidb64,
        'token': token,
    })


def reset_password_complete_view(request):
    """Step 4 — success page after password reset."""
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

    return render(request, 'users/profile.html', {
        'form': form,
        'profile': profile,
        'goal_estimate': goal_estimate,
    })