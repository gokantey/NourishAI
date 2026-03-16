"""
Management command: send_weekly_summary
Sends a weekly meal plan summary email to all Premium users who have a meal plan.
Scheduled to run every Sunday at 7 PM via django-crontab.

Usage:
    python manage.py send_weekly_summary
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from meals.models import MealPlan
from emails import send_weekly_summary_email

User = get_user_model()


class Command(BaseCommand):
    help = 'Send weekly meal plan summary emails to all Premium users'

    def handle(self, *args, **kwargs):
        premium_users = User.objects.filter(
            profile__subscription_tier='premium',
            is_active=True,
        ).select_related('profile')

        sent = 0
        skipped = 0

        for user in premium_users:
            # Get their most recent meal plan
            latest_plan = MealPlan.objects.filter(
                user_profile=user.profile
            ).order_by('-created_at').first()

            if not latest_plan:
                skipped += 1
                continue

            if not latest_plan.meals.exists():
                skipped += 1
                continue

            send_weekly_summary_email(user, latest_plan)
            sent += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Weekly summary emails sent: {sent} | Skipped (no plan): {skipped}'
            )
        )