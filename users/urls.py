from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('verify-otp/', views.verify_otp_view, name='verify_otp'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('onboarding/step1/', views.onboarding_step1, name='onboarding_step1'),
    path('onboarding/step2/', views.onboarding_step2, name='onboarding_step2'),
    path('onboarding/step3/', views.onboarding_step3, name='onboarding_step3'),
    path('profile/', views.profile_view, name='profile'),
    # Forgot password flow
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('forgot-password/done/', views.forgot_password_done_view, name='forgot_password_done'),
    path('reset-password/<uidb64>/<token>/', views.reset_password_view, name='reset_password'),
    path('reset-password/complete/', views.reset_password_complete_view, name='reset_password_complete'),
]