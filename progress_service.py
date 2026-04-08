"""
NourishAI Progress Service
Streak is driven by the daily health checklist — not passive app usage.
A day is "consistent" when the user checks 4+ items on their checklist.
"""

from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Avg, Sum, Count

CONSISTENCY_THRESHOLD = 4  # items checked = consistent day

# All possible checklist items
ALL_CHECKLIST_ITEMS = [
    {'key': 'followed_plan',   'label': 'Followed my meal plan',     'icon': '🍽️'},
    {'key': 'drank_water',     'label': 'Hit my water target',       'icon': '💧'},
    {'key': 'ate_breakfast',   'label': 'Ate breakfast',             'icon': '🌅'},
    {'key': 'was_active',      'label': 'Was physically active',     'icon': '🚶'},
    {'key': 'rated_meal',      'label': 'Rated at least one meal',   'icon': '⭐'},
    {'key': 'slept_well',      'label': 'Got enough sleep',          'icon': '😴'},
]
DEFAULT_ACTIVE_ITEMS = [item['key'] for item in ALL_CHECKLIST_ITEMS]

STREAK_MILESTONES = {7: 'Starter', 14: 'Consistent', 30: 'Disciplined', 60: 'Dedicated', 90: 'Elite'}

ACHIEVEMENTS_DEFINITIONS = [
    {'slug': 'plans_1',    'name': 'First Bite',      'icon': '🍽️', 'description': 'Generated your first meal plan'},
    {'slug': 'plans_5',    'name': 'Getting Started', 'icon': '🍽️', 'description': 'Generated 5 meal plans'},
    {'slug': 'plans_20',   'name': 'Meal Master',     'icon': '🍽️', 'description': 'Generated 20 meal plans'},
    {'slug': 'plans_50',   'name': 'Legend',          'icon': '🏆', 'description': 'Generated 50 meal plans'},
    {'slug': 'streak_7',   'name': 'Starter',         'icon': '🔥', 'description': 'Maintained a 7-day streak'},
    {'slug': 'streak_30',  'name': 'Disciplined',     'icon': '🔥', 'description': 'Maintained a 30-day streak'},
    {'slug': 'streak_90',  'name': 'Elite',           'icon': '🔥', 'description': 'Maintained a 90-day streak'},
    {'slug': 'rated_10',   'name': 'Critic',          'icon': '⭐', 'description': 'Rated 10 meals'},
    {'slug': 'rated_50',   'name': 'Connoisseur',     'icon': '⭐', 'description': 'Rated 50 meals'},
    {'slug': 'saves_3',    'name': 'Collector',       'icon': '📌', 'description': 'Saved 3 meal plans'},
    {'slug': 'saves_7',    'name': 'Archivist',       'icon': '📌', 'description': 'Saved 7 meal plans'},
    {'slug': 'checkin_7',  'name': 'Clean Week',      'icon': '🥗', 'description': 'Completed checklist 7 days in a row'},
    {'slug': 'hydration',  'name': 'Hydration Hero',  'icon': '💧', 'description': 'Hit water goal 5 days in a row'},
    {'slug': 'comeback',   'name': 'Comeback Kid',    'icon': '💪', 'description': 'Rebuilt your streak after breaking it'},
    {'slug': 'perfect_day','name': 'Perfect Day',     'icon': '✨', 'description': 'Checked all 6 items in one day'},
]


def get_or_create_streak(user):
    from meals.models import StreakRecord
    streak, _ = StreakRecord.objects.get_or_create(user=user)
    return streak


def get_freeze_status(streak):
    """
    Same rolling-window pattern as generation_reset_date.
    3 freezes per 30-day window. Window starts on first use.
    Returns the streak record after applying any reset, plus remaining count.
    """
    today = date.today()
    if streak.freeze_reset_date and today >= streak.freeze_reset_date + timedelta(days=30):
        streak.freeze_tokens = 3
        streak.freeze_reset_date = None
        streak.save(update_fields=['freeze_tokens', 'freeze_reset_date'])
    return streak


def get_active_items(user):
    """Returns the user's active checklist item keys, defaulting to all items."""
    prefs = user.profile.checklist_items
    if not prefs:
        return DEFAULT_ACTIVE_ITEMS
    return prefs


def get_today_checkin(user):
    """Returns today's DailyCheckin for user, or None."""
    from meals.models import DailyCheckin
    today = timezone.now().date()
    return DailyCheckin.objects.filter(user=user, date=today).first()


def submit_checkin(user, completed_item_keys):
    """
    Called when user submits their daily checklist.
    Creates/updates DailyCheckin, then updates StreakRecord.
    Returns (checkin, streak, is_new_consistent_day).
    """
    from meals.models import DailyCheckin, StreakRecord
    today = timezone.now().date()

    active_items = get_active_items(user)
    # Only count items that are in the user's active list
    valid_completed = [k for k in completed_item_keys if k in active_items]
    items_completed = len(valid_completed)
    is_consistent = items_completed >= CONSISTENCY_THRESHOLD

    checkin, created = DailyCheckin.objects.update_or_create(
        user=user, date=today,
        defaults={
            'completed_items': valid_completed,
            'items_completed': items_completed,
            'is_consistent': is_consistent,
        }
    )

    # Update streak only if this is a consistent day
    streak = get_or_create_streak(user)
    was_already_consistent = not created and checkin.is_consistent

    if is_consistent and not was_already_consistent:
        yesterday = today - timedelta(days=1)

        if streak.last_active_date == yesterday:
            # Consecutive — extend
            streak.current_streak += 1
        elif streak.last_active_date is not None and streak.last_active_date < yesterday:
            days_missed = (today - streak.last_active_date).days - 1
            if days_missed == 1 and streak.freeze_tokens > 0:
                # Freeze saves the streak
                streak.freeze_tokens -= 1
                streak.current_streak += 1
            else:
                # Broken — flag for comeback mode, reset
                streak.current_streak = 1
        else:
            streak.current_streak = 1

        streak.last_active_date = today
        streak.total_active_days += 1
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
        streak.save()

    return checkin, streak, is_consistent and not was_already_consistent


def check_and_award_achievements(user):
    """Checks all achievement conditions and awards newly earned ones."""
    from meals.models import Achievement, UserAchievement, Meal, DailyCheckin

    for defn in ACHIEVEMENTS_DEFINITIONS:
        Achievement.objects.get_or_create(
            slug=defn['slug'],
            defaults={'name': defn['name'], 'icon': defn['icon'], 'description': defn['description']}
        )

    already = set(UserAchievement.objects.filter(user=user).values_list('achievement__slug', flat=True))
    profile = user.profile

    total_plans = profile.meal_plans.count()
    total_saved = profile.meal_plans.filter(is_saved=True).count()
    total_rated = Meal.objects.filter(meal_plan__user_profile=profile, rating__isnull=False).count()

    try:
        current_streak = user.streak.current_streak
    except Exception:
        current_streak = 0

    # Check perfect day (all 6 items)
    from meals.models import DailyCheckin
    today = timezone.now().date()
    today_checkin = DailyCheckin.objects.filter(user=user, date=today).first()
    had_perfect_day = today_checkin and len(today_checkin.completed_items) == 6

    # Hydration hero — water checked 5 consecutive days
    recent_checkins = DailyCheckin.objects.filter(user=user).order_by('-date')[:5]
    hydration_streak = all('drank_water' in (c.completed_items or []) for c in recent_checkins) and len(recent_checkins) == 5

    conditions = {
        'plans_1':     total_plans >= 1,
        'plans_5':     total_plans >= 5,
        'plans_20':    total_plans >= 20,
        'plans_50':    total_plans >= 50,
        'streak_7':    current_streak >= 7,
        'streak_30':   current_streak >= 30,
        'streak_90':   current_streak >= 90,
        'rated_10':    total_rated >= 10,
        'rated_50':    total_rated >= 50,
        'saves_3':     total_saved >= 3,
        'saves_7':     total_saved >= 7,
        'checkin_7':   current_streak >= 7,
        'hydration':   hydration_streak,
        'perfect_day': had_perfect_day,
    }

    newly_unlocked = []
    for slug, met in conditions.items():
        if met and slug not in already:
            achievement = Achievement.objects.get(slug=slug)
            UserAchievement.objects.create(user=user, achievement=achievement)
            newly_unlocked.append({
                'slug': slug, 'name': achievement.name,
                'icon': achievement.icon, 'description': achievement.description,
            })

    return newly_unlocked


def compute_health_score(user):
    """0-100 score based on real checkin data + plan usage."""
    from meals.models import Meal, DailyCheckin
    profile = user.profile
    score = 0.0

    # 1. Streak / checkin consistency (35 pts)
    try:
        streak = user.streak
        score += min(streak.current_streak / 30 * 35, 35)
    except Exception:
        pass

    # 2. Checkin quality over last 14 days (25 pts)
    recent_checkins = DailyCheckin.objects.filter(
        user=user,
        date__gte=timezone.now().date() - timedelta(days=14)
    )
    if recent_checkins.exists():
        avg_items = recent_checkins.aggregate(avg=Avg('items_completed'))['avg'] or 0
        score += (avg_items / 6) * 25

    # 3. Meal rating quality (20 pts)
    rated = Meal.objects.filter(meal_plan__user_profile=profile, rating__isnull=False).order_by('-meal_plan__created_at')[:20]
    if rated.exists():
        avg_rating = rated.aggregate(avg=Avg('rating'))['avg'] or 0
        score += (avg_rating / 5) * 20

    # 4. Plan generation frequency (20 pts)
    from django.utils import timezone as tz
    thirty_ago = tz.now() - timedelta(days=30)
    recent_plans = profile.meal_plans.filter(created_at__gte=thirty_ago).count()
    score += min(recent_plans / 4 * 20, 20)

    return round(min(score, 100))


def get_weekly_nutrition(user, weeks=6):
    from meals.models import Meal
    profile = user.profile
    result = []
    for i in range(weeks - 1, -1, -1):
        week_end = timezone.now() - timedelta(weeks=i)
        week_start = week_end - timedelta(weeks=1)
        plans = profile.meal_plans.filter(created_at__gte=week_start, created_at__lt=week_end)
        meals = Meal.objects.filter(meal_plan__in=plans)
        totals = meals.aggregate(calories=Sum('calories'), protein=Sum('protein'), carbs=Sum('carbohydrates'), fats=Sum('fats'))
        result.append({
            'label': f'W{weeks - i}',
            'calories': totals['calories'] or 0,
            'protein': round(totals['protein'] or 0, 1),
            'carbs': round(totals['carbs'] or 0, 1),
            'fats': round(totals['fats'] or 0, 1),
        })
    return result


def get_calendar_data(user, days=35):
    """
    Returns last N days with status based on actual DailyCheckin records.
    green  = is_consistent (4+ items)
    yellow = checked in but < 4 items
    empty  = no checkin
    """
    from meals.models import DailyCheckin
    today = timezone.now().date()
    start = today - timedelta(days=days - 1)

    checkins = {
        c.date: c for c in
        DailyCheckin.objects.filter(user=user, date__gte=start)
    }

    result = []
    d = start
    while d <= today:
        checkin = checkins.get(d)
        if checkin and checkin.is_consistent:
            status = 'green'
        elif checkin:
            status = 'yellow'
        else:
            status = 'empty'
        result.append({'date': d.isoformat(), 'status': status, 'items': checkin.items_completed if checkin else 0})
        d += timedelta(days=1)

    return result


def generate_ai_insights(user):
    from meals.models import Meal, DailyCheckin
    profile = user.profile
    insights = []

    # Checkin-based insights
    checkins = DailyCheckin.objects.filter(user=user).order_by('-date')[:14]
    if checkins.exists():
        breakfast_misses = sum(1 for c in checkins if 'ate_breakfast' in (c.completed_items or []) is False)
        if breakfast_misses >= 5:
            insights.append({'type': 'warning', 'icon': '🌅', 'text': 'You\'ve skipped breakfast most days this week. A quick morning meal can boost your energy and metabolism.'})

        water_hits = sum(1 for c in checkins if 'drank_water' in (c.completed_items or []))
        if water_hits >= 10:
            insights.append({'type': 'positive', 'icon': '💧', 'text': f'Great hydration! You hit your water goal {water_hits} of the last 14 days.'})
        elif water_hits < 5:
            insights.append({'type': 'warning', 'icon': '💧', 'text': 'You\'re hitting your water goal less than half the time. Try keeping a bottle at your desk.'})

        consistent_days = sum(1 for c in checkins if c.is_consistent)
        if consistent_days >= 10:
            insights.append({'type': 'positive', 'icon': '🔥', 'text': f'You\'ve been consistent on {consistent_days} of the last 14 days. That\'s excellent discipline.'})

        activity_days = sum(1 for c in checkins if 'was_active' in (c.completed_items or []))
        if activity_days < 4:
            insights.append({'type': 'warning', 'icon': '🚶', 'text': 'You\'ve only been physically active a few days this week. Even a 20-minute walk counts.'})

    # Meal-based insights
    all_meals = Meal.objects.filter(meal_plan__user_profile=profile)
    if all_meals.exists():
        weekend = all_meals.filter(day__in=['saturday', 'sunday'])
        weekday = all_meals.filter(day__in=['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
        if weekend.exists() and weekday.exists():
            wend_avg = weekend.aggregate(avg=Avg('calories'))['avg'] or 0
            wday_avg = weekday.aggregate(avg=Avg('calories'))['avg'] or 0
            if wday_avg > 0:
                diff = ((wend_avg - wday_avg) / wday_avg) * 100
                if diff > 20:
                    insights.append({'type': 'info', 'icon': '📊', 'text': f'You eat about {round(diff)}% more calories on weekends. That\'s normal — just stay mindful.'})

        top_rated = all_meals.filter(rating__gte=4).first()
        if top_rated:
            insights.append({'type': 'positive', 'icon': '⭐', 'text': f'Your highest-rated meals include {top_rated.title}. Your next plan will prioritise similar dishes.'})

    if not insights:
        insights.append({'type': 'positive', 'icon': '🌟', 'text': 'Complete your daily checklist to start seeing personalised insights here.'})

    return insights[:5]


def get_full_progress_data(user):
    from meals.models import UserAchievement, Meal, DailyCheckin

    profile = user.profile
    streak = get_or_create_streak(user)
    streak = get_freeze_status(streak)  # apply 30-day reset if due
    today = timezone.now().date()

    # Milestone
    milestone = None
    for days, label in sorted(STREAK_MILESTONES.items()):
        if streak.current_streak >= days:
            milestone = label
    next_milestone = next(((days, label) for days, label in sorted(STREAK_MILESTONES.items()) if streak.current_streak < days), None)

    # Today's checkin
    today_checkin = get_today_checkin(user)
    active_items = get_active_items(user)
    checklist_items_full = [
        {**item, 'active': item['key'] in active_items, 'completed': item['key'] in (today_checkin.completed_items if today_checkin else [])}
        for item in ALL_CHECKLIST_ITEMS
    ]

    # Stats
    total_plans = profile.meal_plans.count()
    total_rated = Meal.objects.filter(meal_plan__user_profile=profile, rating__isnull=False).count()
    total_consistent = DailyCheckin.objects.filter(user=user, is_consistent=True).count()
    avg_rating = Meal.objects.filter(meal_plan__user_profile=profile, rating__isnull=False).aggregate(avg=Avg('rating'))['avg']

    # Achievements
    unlocked = {ua.achievement.slug: ua for ua in UserAchievement.objects.filter(user=user).select_related('achievement')}
    all_achievements = [{
        'slug': d['slug'], 'name': d['name'], 'icon': d['icon'], 'description': d['description'],
        'unlocked': d['slug'] in unlocked,
        'unlocked_at': unlocked[d['slug']].unlocked_at.isoformat() if d['slug'] in unlocked else None,
    } for d in ACHIEVEMENTS_DEFINITIONS]

    # Latest plan snapshot
    recent_plan = profile.meal_plans.order_by('-created_at').first()
    snapshot = None
    if recent_plan:
        meals = recent_plan.meals.all()
        if meals.exists():
            t = meals.aggregate(calories=Sum('calories'), protein=Sum('protein'), carbs=Sum('carbohydrates'), fats=Sum('fats'), fibre=Sum('fibre'))
            target = (profile.daily_calorie_target or 2000) * 7
            snapshot = {
                'calories': t['calories'] or 0, 'protein': round(t['protein'] or 0, 1),
                'carbs': round(t['carbs'] or 0, 1), 'fats': round(t['fats'] or 0, 1),
                'fibre': round(t['fibre'] or 0, 1), 'calorie_target': target,
                'meal_count': meals.count(),
            }

    return {
        'streak': {
            'current': streak.current_streak, 'longest': streak.longest_streak,
            'total_active_days': streak.total_active_days,
            'last_active': streak.last_active_date.isoformat() if streak.last_active_date else None,
            'freeze_tokens': streak.freeze_tokens,
            'freeze_reset_date': streak.freeze_reset_date.isoformat() if streak.freeze_reset_date else None,
            'milestone': milestone,
            'next_milestone': next_milestone[1] if next_milestone else None,
            'next_milestone_days': next_milestone[0] if next_milestone else None,
        },
        'health_score': compute_health_score(user),
        'checklist': {
            'items': checklist_items_full,
            'today_completed': today_checkin.completed_items if today_checkin else [],
            'today_count': today_checkin.items_completed if today_checkin else 0,
            'today_is_consistent': today_checkin.is_consistent if today_checkin else False,
            'checked_in_today': today_checkin is not None,
        },
        'stats': {
            'total_plans': total_plans, 'total_rated': total_rated,
            'total_consistent_days': total_consistent,
            'avg_rating': round(avg_rating, 1) if avg_rating else None,
        },
        'today_snapshot': snapshot,
        'weekly_nutrition': get_weekly_nutrition(user, weeks=6),
        'calendar': get_calendar_data(user, days=35),
        'insights': generate_ai_insights(user),
        'achievements': all_achievements,
    }