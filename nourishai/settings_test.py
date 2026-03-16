"""
nourishai/settings_test.py

Test settings for NourishAI.
Uses PostgreSQL (same as production) with a separate test database.

Django automatically creates a database named 'test_<DB_NAME>' when
you run tests, and drops it when the tests finish. Your main database
is never touched.

Usage:
    python manage.py test --settings=nourishai.settings_test --verbosity=2
"""

from nourishai.settings import *  # noqa: F401, F403

# ── Keep PostgreSQL — same engine as production ───────────────
# Django will automatically create 'test_nourishai_db' (or whatever
# TEST['NAME'] is set to), run all migrations into it, run your tests,
# then drop it. Your real database is never touched.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'nourishai_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'TEST': {
            # Name of the temporary database Django creates for tests.
            # Dropped automatically when tests finish.
            'NAME': 'test_nourishai',
        },
    }
}

# ── Capture emails in memory, don't send real ones ────────────
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ── Fast password hashing for tests ──────────────────────────
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# ── Dummy external API keys ───────────────────────────────────
GROQ_API_KEY = 'test-dummy-key'
PAYSTACK_SECRET_KEY = 'test-dummy-key'