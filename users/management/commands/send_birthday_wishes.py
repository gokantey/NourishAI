"""
Management command: send_birthday_wishes
Sends a birthday email + in-app notification to all users whose birthday is today.
Schedule to run daily at 8 AM.

Usage:
    python manage.py send_birthday_wishes
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import date
from emails import send_birthday_email
from notifications import notify_birthday

User = get_user_model()


class Command(BaseCommand):
    help = 'Send birthday wishes to users whose birthday is today'

    def handle(self, *args, **kwargs):
        today = date.today()
        # Find all users whose DOB month and day match today
        birthday_users = User.objects.filter(
            profile__date_of_birth__month=today.month,
            profile__date_of_birth__day=today.day,
            is_active=True,
        ).select_related('profile')

        sent = 0
        for user in birthday_users:
            send_birthday_email(user)
            notify_birthday(user)
            sent += 1
            self.stdout.write(f'  Birthday wishes sent to {user.email}')

        self.stdout.write(
            self.style.SUCCESS(f'Birthday wishes sent: {sent}')
        )