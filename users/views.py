from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import (
    RegisterForm, OnboardingStep1Form,
    OnboardingStep2Form, OnboardingStep3Form,
    ProfileUpdateForm
)
from .models import UserProfile


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
            return redirect('meals:dashboard')
    else:
        form = AuthenticationForm()
    return render(request, 'users/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('users:login')


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
            messages.success(request, 'Profile complete! Generating your first meal plan...')
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
    