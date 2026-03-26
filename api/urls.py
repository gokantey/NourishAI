from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, admin_views

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

    # Phase 9 — Snacks & Rebalancing
    path('plans/<int:pk>/snacks/', views.snacks_view, name='plan_snacks'),
    path('plans/<int:pk>/rebalance/', views.rebalance_view, name='plan_rebalance'),

    # Phase 8 — PDF & Share
    path('plans/<int:pk>/export-pdf/', views.export_pdf_view, name='export_pdf'),
    path('plans/<int:pk>/share/', views.share_plan_view, name='share_plan'),
    path('shared/<uuid:token>/', views.public_shared_plan_view, name='public_shared_plan'),

    # Progress
    path('progress/', views.progress_view, name='api_progress'),
    path('progress/checkin/', views.checkin_view, name='api_checkin'),
    path('progress/freeze/', views.use_freeze_view, name='api_freeze'),
    path('progress/checklist-prefs/', views.update_checklist_prefs_view, name='api_checklist_prefs'),
    # ── Admin Portal ──────────────────────────────────────────────────────────
    path('admin-portal/login/',                      admin_views.admin_login_view,              name='admin_login'),
    path('admin-portal/dashboard/',                  admin_views.admin_dashboard_view,          name='admin_dashboard'),
    path('admin-portal/users/',                      admin_views.admin_users_view,              name='admin_users'),
    path('admin-portal/users/<int:user_id>/',        admin_views.admin_user_detail_view,        name='admin_user_detail'),
    path('admin-portal/users/<int:user_id>/action/', admin_views.admin_user_action_view,        name='admin_user_action'),
    path('admin-portal/plans/',                      admin_views.admin_plans_view,              name='admin_plans'),
    path('admin-portal/plans/<int:plan_id>/delete/', admin_views.admin_plan_delete_view,        name='admin_plan_delete'),
    path('admin-portal/ai/',                         admin_views.admin_ai_monitor_view,         name='admin_ai'),
    path('admin-portal/payments/',                   admin_views.admin_payments_view,           name='admin_payments'),
    path('admin-portal/notifications/',              admin_views.admin_notifications_view,      name='admin_notifications'),
    path('admin-portal/notifications/broadcast/',    admin_views.admin_broadcast_view,          name='admin_broadcast'),
    path('admin-portal/achievements/',               admin_views.admin_achievements_view,       name='admin_achievements'),
    path('admin-portal/achievements/create/',        admin_views.admin_achievement_create_view, name='admin_achievement_create'),
    path('admin-portal/system/',                     admin_views.admin_system_view,             name='admin_system'),
    path('admin-portal/system/run-command/',         admin_views.admin_run_command_view,        name='admin_run_command'),
]