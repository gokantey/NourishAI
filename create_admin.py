import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nourishai.settings')
django.setup()

from django.contrib.auth import get_user_model

def create_admin():
    User = get_user_model()
    # Read credentials from environment variables or use safe defaults
    username = os.environ.get('ADMIN_USERNAME', 'admin')
    email = os.environ.get('ADMIN_EMAIL', 'admin@nourishai.com')
    password = os.environ.get('ADMIN_PASSWORD', 'NourishAdmin2026!')

    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Superuser '{username}' created successfully!")
    else:
        # If user exists, we can optionally make sure they are staff/superuser
        u = User.objects.get(username=username)
        u.is_staff = True
        u.is_superuser = True
        u.save()
        print(f"User '{username}' already exists and has been verified as superuser.")

if __name__ == '__main__':
    create_admin()
