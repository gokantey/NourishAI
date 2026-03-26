"""
NourishAI Admin Portal API
All endpoints require is_staff=True.
"""
import json
from datetime import timedelta, date

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


class IsStaff(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


# ── Auth ──────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([])
def admin_login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_staff:
        return Response({'error': 'Admin access only.'}, status=status.HTTP_403_FORBIDDEN)
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {'username': user.username, 'email': user.email, 'name': f'{user.first_name} {user.last_name}'.strip()},
    })


# ── Dashboard Overview ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_dashboard_view(request):
    from meals.models import MealPlan, Notification
    from users.models import UserProfile

    now = timezone.now()
    today = now.date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    total_users = User.objects.filter(is_staff=False).count()
    new_users_week = User.objects.filter(is_staff=False, date_joined__date__gte=week_ago).count()
    new_users_today = User.objects.filter(is_staff=False, date_joined__date=today).count()

    premium_count = UserProfile.objects.filter(subscription_tier='premium').count()
    free_count = total_users - premium_count

    plans_today = MealPlan.objects.filter(created_at__date=today).count()
    plans_week = MealPlan.objects.filter(created_at__date__gte=week_ago).count()
    plans_total = MealPlan.objects.count()

    saved_plans = MealPlan.objects.filter(is_saved=True).count()

    # Revenue estimate (GHS 20/month per premium user)
    revenue_estimate = premium_count * 20

    # Daily signups last 14 days
    signups_chart = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        count = User.objects.filter(is_staff=False, date_joined__date=d).count()
        signups_chart.append({'date': str(d), 'count': count})

    # Plans generated last 14 days
    plans_chart = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        count = MealPlan.objects.filter(created_at__date=d).count()
        plans_chart.append({'date': str(d), 'count': count})

    # Recent activity
    recent_users = User.objects.filter(is_staff=False).order_by('-date_joined')[:5].values(
        'id', 'username', 'first_name', 'last_name', 'email', 'date_joined'
    )

    return Response({
        'stats': {
            'total_users': total_users,
            'new_users_today': new_users_today,
            'new_users_week': new_users_week,
            'premium_count': premium_count,
            'free_count': free_count,
            'plans_today': plans_today,
            'plans_week': plans_week,
            'plans_total': plans_total,
            'saved_plans': saved_plans,
            'revenue_estimate': revenue_estimate,
        },
        'signups_chart': signups_chart,
        'plans_chart': plans_chart,
        'recent_users': list(recent_users),
    })


# ── User Management ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_users_view(request):
    from users.models import UserProfile

    q = request.query_params.get('q', '')
    tier = request.query_params.get('tier', '')
    page = int(request.query_params.get('page', 1))
    per_page = 20

    users = User.objects.filter(is_staff=False).select_related('profile').order_by('-date_joined')

    if q:
        users = users.filter(
            Q(username__icontains=q) | Q(email__icontains=q) |
            Q(first_name__icontains=q) | Q(last_name__icontains=q)
        )
    if tier:
        users = users.filter(profile__subscription_tier=tier)

    total = users.count()
    users = users[(page - 1) * per_page: page * per_page]

    result = []
    for u in users:
        try:
            p = u.profile
            result.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'name': f'{u.first_name} {u.last_name}'.strip(),
                'date_joined': u.date_joined.isoformat(),
                'is_active': u.is_active,
                'subscription_tier': p.subscription_tier,
                'region': p.region,
                'fitness_goal': p.fitness_goal,
                'plan_count': p.meal_plans.count(),
                'bmi': p.bmi,
                'bmi_category': p.bmi_category,
            })
        except Exception:
            pass

    return Response({'users': result, 'total': total, 'page': page, 'per_page': per_page})


@api_view(['GET'])
@permission_classes([IsStaff])
def admin_user_detail_view(request, user_id):
    from meals.models import MealPlan

    try:
        u = User.objects.select_related('profile').get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    p = u.profile
    plans = MealPlan.objects.filter(user_profile=p).order_by('-created_at')[:10].values(
        'id', 'title', 'week_start_date', 'is_saved', 'is_partial', 'created_at'
    )

    streak = None
    try:
        s = u.streak
        streak = {'current': s.current_streak, 'longest': s.longest_streak, 'total_active': s.total_active_days}
    except Exception:
        pass

    return Response({
        'user': {
            'id': u.id, 'username': u.username, 'email': u.email,
            'first_name': u.first_name, 'last_name': u.last_name,
            'date_joined': u.date_joined.isoformat(), 'is_active': u.is_active,
            'is_staff': u.is_staff,
        },
        'profile': {
            'subscription_tier': p.subscription_tier,
            'region': p.region, 'fitness_goal': p.fitness_goal,
            'dietary_preference': p.dietary_preference,
            'allergies': p.allergies, 'health_conditions': p.health_conditions,
            'bmi': p.bmi, 'bmi_category': p.bmi_category,
            'daily_calorie_target': p.daily_calorie_target,
            'daily_water_intake': p.daily_water_intake,
            'plan_generations_count': p.plan_generations_count,
            'budget': str(p.budget) if p.budget else None,
        },
        'plans': list(plans),
        'streak': streak,
    })


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_user_action_view(request, user_id):
    """Actions: upgrade, downgrade, suspend, activate, make_staff, remove_staff"""
    try:
        u = User.objects.select_related('profile').get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    p = u.profile

    if action == 'upgrade':
        p.subscription_tier = 'premium'
        p.save(update_fields=['subscription_tier'])
        return Response({'message': f'{u.username} upgraded to Premium.'})
    elif action == 'downgrade':
        p.subscription_tier = 'free'
        p.save(update_fields=['subscription_tier'])
        return Response({'message': f'{u.username} downgraded to Free.'})
    elif action == 'suspend':
        u.is_active = False
        u.save(update_fields=['is_active'])
        return Response({'message': f'{u.username} suspended.'})
    elif action == 'activate':
        u.is_active = True
        u.save(update_fields=['is_active'])
        return Response({'message': f'{u.username} activated.'})
    elif action == 'make_staff':
        u.is_staff = True
        u.save(update_fields=['is_staff'])
        return Response({'message': f'{u.username} is now staff.'})
    elif action == 'remove_staff':
        u.is_staff = False
        u.save(update_fields=['is_staff'])
        return Response({'message': f'{u.username} staff access removed.'})
    elif action == 'delete':
        username = u.username
        u.delete()
        return Response({'message': f'User {username} deleted permanently.'})
    else:
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


# ── Plan Browser ──────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_plans_view(request):
    from meals.models import MealPlan

    q = request.query_params.get('q', '')
    page = int(request.query_params.get('page', 1))
    per_page = 20

    plans = MealPlan.objects.select_related('user_profile__user').order_by('-created_at')

    if q:
        plans = plans.filter(
            Q(title__icontains=q) |
            Q(user_profile__user__username__icontains=q) |
            Q(user_profile__user__email__icontains=q)
        )

    total = plans.count()
    plans = plans[(page - 1) * per_page: page * per_page]

    result = []
    for pl in plans:
        result.append({
            'id': pl.id,
            'title': pl.title or f'Week of {pl.week_start_date}',
            'week_start_date': str(pl.week_start_date),
            'is_saved': pl.is_saved,
            'is_partial': pl.is_partial,
            'created_at': pl.created_at.isoformat(),
            'user': {
                'id': pl.user_profile.user.id,
                'username': pl.user_profile.user.username,
                'email': pl.user_profile.user.email,
            },
            'meal_count': pl.meals.count(),
        })

    return Response({'plans': result, 'total': total, 'page': page, 'per_page': per_page})


@api_view(['DELETE'])
@permission_classes([IsStaff])
def admin_plan_delete_view(request, plan_id):
    from meals.models import MealPlan
    try:
        plan = MealPlan.objects.get(pk=plan_id)
        plan.delete()
        return Response({'message': 'Plan deleted.'})
    except MealPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)


# ── AI Monitor ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_ai_monitor_view(request):
    from meals.models import MealPlan, Meal
    from users.models import UserProfile

    today = timezone.now().date()
    week_ago = today - timedelta(days=7)

    # Generation stats
    total_plans = MealPlan.objects.count()
    plans_this_week = MealPlan.objects.filter(created_at__date__gte=week_ago).count()
    partial_plans = MealPlan.objects.filter(is_partial=True).count()
    full_plans = MealPlan.objects.filter(is_partial=False).count()

    # Meal stats
    total_meals = Meal.objects.count()
    rated_meals = Meal.objects.filter(rating__isnull=False).count()
    avg_rating = Meal.objects.filter(rating__isnull=False).aggregate(avg=Avg('rating'))['avg']

    # Most generated regions
    region_stats = UserProfile.objects.filter(
        meal_plans__isnull=False
    ).values('region').annotate(plan_count=Count('meal_plans')).order_by('-plan_count')[:8]

    # Most common fitness goals
    goal_stats = UserProfile.objects.exclude(
        fitness_goal=None
    ).values('fitness_goal').annotate(count=Count('id')).order_by('-count')[:6]

    # Daily generation volume last 14 days
    gen_chart = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        count = MealPlan.objects.filter(created_at__date=d).count()
        gen_chart.append({'date': str(d), 'count': count})

    return Response({
        'generation': {
            'total_plans': total_plans,
            'plans_this_week': plans_this_week,
            'full_plans': full_plans,
            'partial_plans': partial_plans,
            'avg_meals_per_plan': round(total_meals / total_plans, 1) if total_plans else 0,
        },
        'meal_quality': {
            'total_meals': total_meals,
            'rated_meals': rated_meals,
            'rating_rate': round(rated_meals / total_meals * 100, 1) if total_meals else 0,
            'avg_rating': round(avg_rating, 2) if avg_rating else None,
        },
        'region_stats': list(region_stats),
        'goal_stats': list(goal_stats),
        'gen_chart': gen_chart,
    })


# ── Payments & Subscriptions ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_payments_view(request):
    from users.models import UserProfile

    premium_users = UserProfile.objects.filter(
        subscription_tier='premium'
    ).select_related('user').order_by('-user__date_joined')

    result = []
    for p in premium_users:
        result.append({
            'user_id': p.user.id,
            'username': p.user.username,
            'email': p.user.email,
            'name': f'{p.user.first_name} {p.user.last_name}'.strip(),
            'date_joined': p.user.date_joined.isoformat(),
            'paystack_customer_id': p.paystack_customer_id or '',
            'paystack_subscription_code': p.paystack_subscription_code or '',
            'is_active': p.user.is_active,
        })

    total_revenue = len(result) * 20  # GHS 20/month

    return Response({
        'premium_users': result,
        'count': len(result),
        'monthly_revenue_estimate': total_revenue,
    })


# ── Broadcast Notifications ───────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsStaff])
def admin_broadcast_view(request):
    from meals.models import Notification

    title = request.data.get('title', '').strip()
    message = request.data.get('message', '').strip()
    target = request.data.get('target', 'all')  # all | premium | free
    notif_type = request.data.get('type', 'general')

    if not title or not message:
        return Response({'error': 'Title and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

    users = User.objects.filter(is_staff=False, is_active=True)
    if target == 'premium':
        users = users.filter(profile__subscription_tier='premium')
    elif target == 'free':
        users = users.filter(profile__subscription_tier='free')

    notifications = [
        Notification(user=u, type=notif_type, title=title, message=message)
        for u in users
    ]
    Notification.objects.bulk_create(notifications)

    return Response({'message': f'Notification sent to {len(notifications)} users.'})


@api_view(['GET'])
@permission_classes([IsStaff])
def admin_notifications_view(request):
    from meals.models import Notification

    recent = Notification.objects.select_related('user').order_by('-created_at')[:50]
    result = [{
        'id': n.id,
        'user': n.user.username,
        'type': n.type,
        'title': n.title,
        'message': n.message[:80],
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
    } for n in recent]

    # Stats
    total = Notification.objects.count()
    unread = Notification.objects.filter(is_read=False).count()

    return Response({'notifications': result, 'total': total, 'unread': unread})


# ── Achievements Manager ──────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_achievements_view(request):
    from meals.models import Achievement, UserAchievement

    achievements = Achievement.objects.annotate(
        unlock_count=Count('userachievement')
    ).order_by('-unlock_count')

    result = [{
        'id': a.id,
        'slug': a.slug,
        'name': a.name,
        'description': a.description,
        'icon': a.icon,
        'unlock_count': a.unlock_count,
    } for a in achievements]

    # Recent unlocks
    recent = UserAchievement.objects.select_related('user', 'achievement').order_by('-unlocked_at')[:20]
    recent_list = [{
        'user': u.user.username,
        'achievement': u.achievement.name,
        'icon': u.achievement.icon,
        'unlocked_at': u.unlocked_at.isoformat(),
    } for u in recent]

    return Response({'achievements': result, 'recent_unlocks': recent_list})


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_achievement_create_view(request):
    from meals.models import Achievement

    slug = request.data.get('slug', '').strip()
    name = request.data.get('name', '').strip()
    description = request.data.get('description', '').strip()
    icon = request.data.get('icon', '🏆').strip()

    if not slug or not name:
        return Response({'error': 'Slug and name required.'}, status=status.HTTP_400_BAD_REQUEST)

    a, created = Achievement.objects.get_or_create(slug=slug, defaults={'name': name, 'description': description, 'icon': icon})
    if not created:
        return Response({'error': 'Achievement with this slug already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'message': f'Achievement "{name}" created.', 'id': a.id})


# ── System Controls ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_system_view(request):
    from meals.models import MealPlan, Notification
    from users.models import UserProfile
    import django
    import sys

    total_users = User.objects.filter(is_staff=False).count()
    total_plans = MealPlan.objects.count()
    total_notifications = Notification.objects.count()
    total_premium = UserProfile.objects.filter(subscription_tier='premium').count()

    return Response({
        'health': {
            'status': 'ok',
            'django_version': django.__version__,
            'python_version': sys.version.split()[0],
            'total_users': total_users,
            'total_plans': total_plans,
            'total_notifications': total_notifications,
            'total_premium': total_premium,
        },
        'scheduled_commands': [
            {'name': 'send_birthday_wishes', 'schedule': '8AM daily', 'description': 'Send birthday emails to users whose birthday is today'},
            {'name': 'send_checkin_reminders', 'schedule': '8PM daily', 'description': 'Remind users who haven\'t checked in today'},
            {'name': 'send_weekly_summary', 'schedule': '9AM Sundays', 'description': 'Send weekly nutrition summary emails'},
        ],
    })


@api_view(['POST'])
@permission_classes([IsStaff])
def admin_run_command_view(request):
    from django.core.management import call_command
    from io import StringIO

    command = request.data.get('command')
    allowed = ['send_birthday_wishes', 'send_checkin_reminders', 'send_weekly_summary']

    if command not in allowed:
        return Response({'error': 'Command not allowed.'}, status=status.HTTP_400_BAD_REQUEST)

    out = StringIO()
    try:
        call_command(command, stdout=out)
        return Response({'message': f'Command "{command}" executed.', 'output': out.getvalue()})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)