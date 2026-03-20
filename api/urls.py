from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register_view, name='api_register'),
    path('auth/verify-otp/', views.verify_otp_view, name='api_verify_otp'),
    path('auth/resend-otp/', views.resend_otp_view, name='api_resend_otp'),
    path('auth/login/', views.login_view, name='api_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('auth/forgot-password/', views.forgot_password_view, name='api_forgot_password'),
    path('auth/reset-password/', views.reset_password_view, name='api_reset_password'),

    # Profile & onboarding
    path('profile/', views.profile_view, name='api_profile'),
    path('profile/update/', views.profile_update_view, name='api_profile_update'),
    path('onboarding/step1/', views.onboarding_step1, name='api_onboarding_step1'),
    path('onboarding/step2/', views.onboarding_step2, name='api_onboarding_step2'),
    path('onboarding/step3/', views.onboarding_step3, name='api_onboarding_step3'),

    # Dashboard & meal plans
    path('dashboard/', views.dashboard_view, name='api_dashboard'),
    path('plans/generate/', views.generate_plan_view, name='api_generate_plan'),
    path('plans/', views.meal_plan_history_view, name='api_plan_history'),
    path('plans/<int:pk>/', views.meal_plan_detail_view, name='api_plan_detail'),
    path('plans/<int:pk>/delete/', views.delete_plan_view, name='api_delete_plan'),
    path('plans/<int:pk>/save/', views.save_plan_view, name='api_save_plan'),
    path('plans/<int:pk>/unsave/', views.unsave_plan_view, name='api_unsave_plan'),

    # Meals
    path('meals/<int:pk>/regenerate/', views.regenerate_meal_view, name='api_regenerate_meal'),
    path('meals/<int:pk>/rate/', views.rate_meal_view, name='api_rate_meal'),

    # Upgrade / payments
    path('upgrade/checkout/', views.create_checkout_view, name='api_checkout'),
    path('upgrade/success/', views.upgrade_success_view, name='api_upgrade_success'),
    path('upgrade/cancel/', views.cancel_subscription_view, name='api_cancel'),
    path('webhook/paystack/', views.paystack_webhook, name='api_webhook'),

    # Notifications
    path('notifications/', views.notifications_view, name='api_notifications'),
    path('notifications/read-all/', views.mark_all_read_view, name='api_notifications_read_all'),
    path('notifications/<int:pk>/read/', views.mark_read_view, name='api_notification_read'),

    # Phase 8 — PDF & Share
    path('plans/<int:pk>/export-pdf/', views.export_pdf_view, name='export_pdf'),
    path('plans/<int:pk>/share/', views.share_plan_view, name='share_plan'),
    path('shared/<uuid:token>/', views.public_shared_plan_view, name='public_shared_plan'),

    # Progress
    path('progress/', views.progress_view, name='api_progress'),
    path('progress/checkin/', views.checkin_view, name='api_checkin'),
    path('progress/freeze/', views.use_freeze_view, name='api_freeze'),
    path('progress/checklist-prefs/', views.update_checklist_prefs_view, name='api_checklist_prefs'),
]