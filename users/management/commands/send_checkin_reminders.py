"""
Management command: send_checkin_reminders
Run daily at 8PM: python manage.py send_checkin_reminders

Sends a notification to users who haven't checked in today.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from meals.models import DailyCheckin, Notification


class Command(BaseCommand):
    help = 'Send daily check-in reminders to users who have not checked in today'

    def handle(self, *args, **options):
        today = timezone.now().date()

        # Users who checked in today
        checked_in_today = set(
            DailyCheckin.objects.filter(date=today).values_list('user_id', flat=True)
        )

        # Active users (checked in at least once in last 14 days)
        active_users = User.objects.filter(
            checkins__date__gte=today - timezone.timedelta(days=14)
        ).distinct().exclude(id__in=checked_in_today)

        sent = 0
        for user in active_users:
            try:
                Notification.objects.create(
                    user=user,
                    type='checkin_reminder',
                    title='⏰ Daily check-in reminder',
                    message="Don't let your streak slip! Log today's healthy habits on your Progress page. It only takes 10 seconds.",
                )
                sent += 1
            except Exception as e:
                self.stderr.write(f'Failed to notify {user.username}: {e}')

        self.stdout.write(self.style.SUCCESS(f'Sent {sent} check-in reminders for {today}'))