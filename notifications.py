from meals.models import Notification


def notify(user, type, title, message):
    """Create an in-app notification for a user."""
    try:
        Notification.objects.create(
            user=user,
            type=type,
            title=title,
            message=message,
        )
    except Exception as e:
        print(f'[NourishAI] Notification creation failed: {e}')


def notify_plan_generated(user, is_partial=False):
    notify(
        user, 'plan_generated',
        title='Meal plan ready!' if not is_partial else '3-day preview ready!',
        message='Your personalised Ghanaian meal plan has been generated. Tap to view it.' if not is_partial
                else 'Your 3-day preview is ready. Upgrade to Premium for the full 7-day experience.',
    )


def notify_plan_saved(user, plan_title):
    notify(
        user, 'plan_saved',
        title='Plan saved!',
        message=f'"{plan_title}" has been saved to your plan history.',
    )


def notify_upgrade(user):
    notify(
        user, 'upgrade',
        title='Welcome to Premium! ✨',
        message='You now have unlimited meal plan generations, AI taste learning, and weekly summaries.',
    )


def notify_cancelled(user):
    notify(
        user, 'cancelled',
        title='Subscription cancelled',
        message="You've been moved to the free plan. You can resubscribe anytime from the Upgrade page.",
    )


def notify_payment_failed(user):
    notify(
        user, 'payment_failed',
        title='Payment failed',
        message='Your Premium payment could not be processed. Please update your payment method to continue.',
    )


def notify_save_limit(user):
    notify(
        user, 'save_limit',
        title='Save limit reached',
        message="You've used your 1 free saved plan. Upgrade to Premium for unlimited saves.",
    )

def notify_birthday(user):
    notify(
        user, 'general',
        title=f'Happy Birthday, {user.first_name}! 🎂',
        message='Wishing you a wonderful birthday from the NourishAI team. Eat well and celebrate today! 🎉',
    )


def notify_streak_milestone(user, days, label):
    notify(
        user, 'streak',
        title=f'🔥 {label} streak — {days} days!',
        message=f"You've maintained a {days}-day streak. You've earned the '{label}' milestone. Keep going!",
    )


def notify_achievement(user, name, description):
    notify(
        user, 'achievement',
        title=f'🏆 Achievement unlocked: {name}',
        message=description,
    )