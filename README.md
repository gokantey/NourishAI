# NourishAI

A full-stack AI-powered meal planning web application built for Ghanaian users. NourishAI generates personalised 7-day Ghanaian meal plans, detailed recipes, grouped shopping lists, and nutrition breakdowns based on each user's health profile, dietary preferences, allergies, BMI, budget, fitness goals, region, and health conditions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django 6 + Django REST Framework |
| **Auth** | JWT via djangorestframework-simplejwt |
| **Database** | PostgreSQL |
| **AI Engine** | Groq API (LLaMA 3.3 70B Versatile) |
| **Frontend** | React 19 + Vite + TailwindCSS 4 |
| **State** | Zustand (persisted to localStorage) |
| **HTTP Client** | Axios (JWT interceptors + auto-refresh + suspended account detection) |
| **Animations** | Framer Motion |
| **Charts** | Recharts (admin dashboard) |
| **Payments** | Paystack (GHS 20/month) |
| **Email** | Gmail SMTP |
| **PDF Export** | ReportLab |
| **Deployment** | Render / Railway / Heroku / VPS |

---

## Features

### Free Tier
- 7 full 7-day AI-generated Ghanaian meal plans per 30-day window
- 3 partial 3-day plans per 30-day window (days 4–7 blurred with upgrade prompt)
- After 10 total generations — blocked until the 30-day window resets
- Save up to 7 plans
- Meal ratings (1–5 stars)
- Snack suggestions per plan
- Goal estimate (weeks/months to target weight)
- **Precision Calorie Calculator**: Uses the Mifflin-St Jeor formula with activity multipliers and fitness goals to calculate personalized TDEE targets (backed by user sex, age, height, weight, activity level, and goals)
- **Simplified Onboarding**: 2-minute setup with an overview splash screen, deferring detailed health conditions to the Profile Page to reduce signup fatigue
- **Medical Disclaimer**: Dietitian warning notice integrated on the meal generation screen
- BMI calculator + daily calorie and water targets
- In-app notification bell (polls every 30s)
- Shopping list

### Premium Tier (GHS 20/month via Paystack)
- Unlimited 7-day plan generations (always full, never partial)
- AI taste learning — ratings shape future Groq prompts
- Unlimited saved plans
- Weekly nutrition summary email (every Sunday)
- Health streak tracking + daily check-in
- Achievement system
- PDF export
- Public plan sharing via link
- Plan rebalancing (regenerates all meals respecting ratings)
- Priority support

### Admin Portal (`/admin-portal/`)
- Separate dark-themed admin interface (staff only)
- Dashboard with recharts area charts (signups + plan generations over 14 days)
- User management: upgrade, downgrade, suspend, activate, delete
- Plan management with search and pagination
- AI usage monitor (Groq token usage)
- Payment history
- Broadcast notifications
- Achievement management
- System health + management command runner

---

## Project Structure

```
NourishAI/                          ← project root (manage.py lives here)
├── api/
│   ├── views.py                    ← all user-facing API views
│   ├── admin_views.py              ← admin portal API views
│   ├── serializers.py
│   └── urls.py
├── users/
│   ├── models.py                   ← UserProfile + generation logic
│   └── tests.py
├── meals/
│   ├── models.py                   ← MealPlan, Meal, ShoppingList, Notification,
│   │                                  DailyCheckin, StreakRecord, Achievement
│   ├── groq_service.py
│   └── management/commands/
│       ├── send_weekly_summary.py
│       ├── send_checkin_reminders.py
│       └── send_birthday_wishes.py
├── nourishai/
│   ├── settings.py
│   ├── settings_test.py            ← test settings (PostgreSQL, locmem email, MD5 passwords)
│   └── urls.py
├── emails.py
├── notifications.py
├── progress_service.py             ← streak + achievement logic
├── pdf_service.py                  ← PDF export (ReportLab)
├── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx                 ← all routes + PrivateRoute / PublicRoute guards
        ├── api/client.js           ← Axios instance + all API endpoint functions
        ├── store/authStore.js      ← Zustand auth store
        ├── components/
        │   ├── layout/AppLayout.jsx
        │   └── ui/
        │       ├── ConfirmModal.jsx
        │       └── NotificationBell.jsx
        ├── pages/                  ← all user-facing pages
        └── admin/
            ├── AdminLayout.jsx
            ├── adminApi.js
            ├── components/
            │   ├── AdminComponents.jsx
            │   └── adminConstants.js
            └── pages/
                ├── AdminLoginPage.jsx
                ├── AdminDashboard.jsx
                ├── AdminUsers.jsx
                ├── AdminUserDetail.jsx
                └── AdminPages.jsx
```

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL
- Groq API key (free at console.groq.com)
- Paystack account (test keys from paystack.com)
- Gmail App Password

### Backend

> [!IMPORTANT]
> Always activate the virtual environment (`venv`) before installing dependencies or running backend commands to avoid `ModuleNotFoundError` exceptions (e.g. for `whitenoise`).

```bash
# From the project root (where manage.py is)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\Activate.ps1 (PowerShell) or venv\Scripts\activate.bat (CMD)
pip install -r requirements.txt
```

Create a `.env` file in the same directory as `manage.py`:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=nourishai_db
DB_USER=nourishai_user
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
GROQ_API_KEY=your-groq-api-key
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_PUBLIC_KEY=pk_test_your_key
EMAIL_HOST_USER=team.nourishai@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
```

```bash
python manage.py migrate
python manage.py createsuperuser   # required for admin portal access
python manage.py runserver         # runs at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                        # runs at http://localhost:5173
```

Vite proxies all `/api/*` requests to Django automatically.

---

## Running Tests

Ensure your virtual environment is active first:
```bash
venv\Scripts\python manage.py test --settings=nourishai.settings_test --verbosity=2
```

Tests cover: generation window logic (7 full / 3 partial / blocked at 10 / 30-day reset), Mifflin-St Jeor TDEE formulas, save limits, BMI calculation, calorie targets, and API endpoint auth/ownership checks.

---

## CI/CD

GitHub Actions runs on every push:

**Backend job:** system check → migrate → run tests
**Frontend job:** `npm ci` → ESLint (0 errors required) → Vite build

---

## Generation Logic

Defined in `users/models.py → get_generation_status()`:

| Condition | Result |
|---|---|
| No window started (`reset_date = None`) | `full` |
| `count < 7` | `full` |
| `count` 7–9 | `partial` (days 4–7 blurred) |
| `count >= 10` | `blocked` |
| `today >= reset_date + 30 days` | Reset to 0, `full` (fresh window) |

Premium/staff/superuser always get `full` regardless of count.

---

## API Reference

All endpoints under `/api/`. JWT Bearer token required unless marked as public.

### Auth
| Method | Endpoint | Notes |
|---|---|---|
| POST | `/auth/register/` | Validates, stores in session, sends OTP |
| POST | `/auth/verify-otp/` | Confirms OTP, creates user, returns JWT |
| POST | `/auth/resend-otp/` | Resends OTP |
| POST | `/auth/login/` | Returns JWT + `onboarding_complete` + `subscription_tier`. Returns `error_code: account_suspended` (403) for suspended accounts |
| POST | `/auth/token/refresh/` | Refresh access token |
| POST | `/auth/forgot-password/` | Sends reset link |
| POST | `/auth/reset-password/` | Accepts uid + token + new_password |

### Meal Plans
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/dashboard/` | Profile + latest plan + saved plans + goal estimate |
| POST | `/plans/generate/` | Calls Groq; returns 403 if blocked |
| GET | `/plans/` | History |
| GET | `/plans/<pk>/` | Full plan with meals, snacks, shopping list, show_lock, can_save |
| DELETE | `/plans/<pk>/delete/` | Hard delete |
| POST | `/plans/<pk>/save/` | `{ title? }` |
| POST | `/plans/<pk>/unsave/` | |
| POST | `/plans/<pk>/snacks/` | AI snack generation (saved to plan) |
| POST | `/plans/<pk>/rebalance/` | Regenerate meals respecting ratings |
| GET | `/plans/<pk>/export-pdf/` | Returns PDF blob (Premium) |
| POST | `/plans/<pk>/share/` | Returns public share URL (Premium) |
| GET | `/shared/<uuid:token>/` | Public — no auth required |
| POST | `/meals/<pk>/regenerate/` | Regenerate single meal |
| POST | `/meals/<pk>/rate/` | `{ rating: 1–5 }` |

### Upgrade / Paystack
| Method | Endpoint | Notes |
|---|---|---|
| POST | `/upgrade/checkout/` | Returns Paystack `authorization_url` |
| GET | `/upgrade/success/?reference=...` | Verifies payment, upgrades user |
| POST | `/upgrade/cancel/` | Reverts to free |
| POST | `/webhook/paystack/` | HMAC-verified webhook (public) |

### Progress (Premium)
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/progress/` | Streak, achievements, checkin status |
| POST | `/progress/checkin/` | `{ completed_items: [...] }` |
| POST | `/progress/freeze/` | Use a streak freeze |
| POST | `/progress/checklist-prefs/` | Save checklist preferences |

### Notifications
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/notifications/` | Last 30, includes `unread_count` |
| POST | `/notifications/read-all/` | Bulk mark read |
| POST | `/notifications/<pk>/read/` | Single mark read |

---

## Management Commands

```bash
# Weekly nutrition summary email — schedule every Sunday at 7 PM
python manage.py send_weekly_summary

# Daily check-in reminders for Premium users
python manage.py send_checkin_reminders

# Birthday wishes
python manage.py send_birthday_wishes

# Activate cron jobs (Linux / compatible environments only)
python manage.py crontab add
```

---

## Production Checklist

- [ ] Update `CORS_ALLOWED_ORIGINS` in `settings.py` with production domain
- [ ] Update `frontend_url` in `api/views.py` (Paystack callback + password reset links)
- [ ] `npm run build` in `frontend/` — Django serves `dist/index.html` for all non-API routes
- [ ] Set `DEBUG=False` and configure `STATIC_ROOT`
- [ ] Add all required environment variables to your hosting provider's configuration dashboard (e.g., Render, Railway, Heroku, VPS)
- [ ] Register Paystack webhook URL: `https://yourdomain.com/api/webhook/paystack/`
- [ ] `python manage.py crontab add` for scheduled commands (Linux / compatible hosts only)
- [ ] Regenerate `requirements.txt` on Unix: `pip freeze > requirements.txt`