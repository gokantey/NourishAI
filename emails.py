"""
NourishAI Email Module
All outgoing emails live here. Import and call as needed from views and management commands.
"""

from django.core.mail import send_mail
from django.conf import settings


def send_welcome_email(user):
    """Sent after OTP verified and account created."""
    try:
        send_mail(
            subject='Welcome to NourishAI 🌿',
            message=(
                f'Hi {user.first_name},\n\n'
                f'Your account has been verified and you\'re officially part of NourishAI!\n\n'
                f'Here\'s what you can do on the free plan:\n'
                f'  • Generate 7 full 7-day meal plans per month\n'
                f'  • Get 3-day previews on generations 8–10\n'
                f'  • Save 1 meal plan\n'
                f'  • Rate your meals and track your goals\n\n'
                f'Ready to eat well? Head to your dashboard and generate your first plan.\n\n'
                f'Upgrade to Premium anytime for unlimited plans, AI taste learning, and more.\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass


def send_premium_upgrade_email(user):
    """Sent after successful payment and premium upgrade."""
    try:
        send_mail(
            subject='You\'re now on NourishAI Premium ✨',
            message=(
                f'Hi {user.first_name},\n\n'
                f'Your Premium subscription is now active. Here\'s everything you\'ve unlocked:\n\n'
                f'  • Unlimited meal plan generations\n'
                f'  • Full 7-day plans every time\n'
                f'  • AI taste learning — your ratings now shape every plan\n'
                f'  • Unlimited saved plans\n'
                f'  • Weekly meal plan summary emails (every Sunday evening)\n'
                f'  • Export & sharing features (coming soon)\n'
                f'  • Health streak & progress tracking (coming soon)\n\n'
                f'Go generate your first Premium plan now — the AI is ready to learn your taste.\n\n'
                f'Thank you for supporting NourishAI.\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass


def send_cancellation_email(user):
    """Sent after subscription is cancelled."""
    try:
        send_mail(
            subject='Your NourishAI Premium subscription has been cancelled',
            message=(
                f'Hi {user.first_name},\n\n'
                f'Your Premium subscription has been cancelled. You\'ve been moved back to the free plan.\n\n'
                f'On the free plan you still have access to:\n'
                f'  • Your existing saved plan\n'
                f'  • Your meal history (for 7 days)\n'
                f'  • Goal estimate and profile features\n\n'
                f'If this was a mistake or you\'d like to resubscribe, you can upgrade again anytime '
                f'from your dashboard.\n\n'
                f'We\'d love to have you back.\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass


def send_payment_failed_email(user):
    """Sent when a recurring payment fails."""
    try:
        send_mail(
            subject='NourishAI — Payment failed, action required',
            message=(
                f'Hi {user.first_name},\n\n'
                f'We were unable to process your NourishAI Premium payment. '
                f'Your account has been moved to the free plan.\n\n'
                f'To continue enjoying Premium features, please update your payment method and resubscribe '
                f'from your dashboard.\n\n'
                f'If you believe this is an error, please contact your bank or reach out to us.\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass


def send_save_limit_email(user):
    """Sent when a free user hits their 1 save limit."""
    try:
        send_mail(
            subject='You\'ve reached your save limit on NourishAI',
            message=(
                f'Hi {user.first_name},\n\n'
                f'You\'ve saved your 7 free meal plans — that\'s the limit on the free tier.\n\n'
                f'To save more plans, upgrade to NourishAI Premium:\n'
                f'  • Unlimited saved plans\n'
                f'  • Unlimited meal plan generations\n'
                f'  • AI taste learning\n'
                f'  • Weekly summary emails\n'
                f'  • Only GHS 20/month\n\n'
                f'Upgrade from your dashboard anytime.\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass


def send_weekly_summary_email(user, meal_plan):
    """
    Sent every Sunday at 7 PM to Premium users.
    Summarises their most recent meal plan's nutrition totals.
    """
    try:
        meals = meal_plan.meals.all()
        if not meals.exists():
            return

        total_calories = sum(m.calories for m in meals)
        total_protein = round(sum(m.protein for m in meals), 1)
        total_carbs = round(sum(m.carbohydrates for m in meals), 1)
        total_fats = round(sum(m.fats for m in meals), 1)
        total_fibre = round(sum(m.fibre for m in meals), 1)
        meal_count = meals.count()

        # Get top rated meal if any
        top_meal = meals.filter(rating__gte=4).order_by('-rating').first()
        top_meal_line = (
            f'  • Your top rated meal this week: {top_meal.title} ({top_meal.rating}/5 ⭐)\n'
            if top_meal else ''
        )

        plan_label = meal_plan.title if meal_plan.title else f'Plan from {meal_plan.week_start_date.strftime("%d %b %Y")}'

        send_mail(
            subject=f'Your NourishAI Weekly Summary 🌿',
            message=(
                f'Hi {user.first_name},\n\n'
                f'Here\'s your weekly nutrition summary for "{plan_label}":\n\n'
                f'  • Total meals: {meal_count}\n'
                f'  • Total calories: {total_calories} kcal\n'
                f'  • Total protein: {total_protein}g\n'
                f'  • Total carbohydrates: {total_carbs}g\n'
                f'  • Total fats: {total_fats}g\n'
                f'  • Total fibre: {total_fibre}g\n'
                f'{top_meal_line}\n'
                f'Keep rating your meals — the more you rate, the better your AI-generated plans become.\n\n'
                f'Head to your dashboard to generate a fresh plan for next week.\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass

def send_birthday_email(user):
    """Sent on the user's birthday."""
    try:
        send_mail(
            subject=f'Happy Birthday from NourishAI, {user.first_name}! 🎂',
            message=(
                f'Hi {user.first_name},\n\n'
                f'The whole NourishAI team wishes you a wonderful birthday! 🎉🎂\n\n'
                f'Today is your day — eat well, feel great, and celebrate.\n\n'
                f'As you start this new year of your life, we\'re here to help you '
                f'stay nourished and feel your best every day.\n\n'
                f'Go treat yourself — you deserve it! 🌿\n\n'
                f'— The NourishAI Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass