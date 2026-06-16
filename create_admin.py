import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nourishai.settings')
django.setup()

from django.contrib.auth import get_user_model

def create_admin():
    User = get_user_model()
    
    # Read credentials ONLY from environment variables (local .env or Render settings)
    username = os.environ.get('ADMIN_USERNAME')
    email = os.environ.get('ADMIN_EMAIL')
    password = os.environ.get('ADMIN_PASSWORD')

    if not username or not password:
        print("Skipping admin creation: ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be configured.")
        return

    email = email or f"{username}@nourishai.com"

    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Superuser '{username}' created successfully!")
    else:
        # If user exists, verify staff status and update password if it changed in env settings
        u = User.objects.get(username=username)
        u.is_staff = True
        u.is_superuser = True
        u.email = email
        u.set_password(password)
        u.save()
        print(f"User '{username}' password and admin status successfully synchronized.")

if __name__ == '__main__':
    create_admin()
