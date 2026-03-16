# NourishAI

A full-stack AI-powered meal planning web application built for Ghanaian users. NourishAI generates personalised 7-day Ghanaian meal plans, detailed recipes, grouped shopping lists, and nutrition breakdowns based on each user's health profile, dietary preferences, allergies, BMI, budget, fitness goals, region, and health conditions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django (REST API) + Django REST Framework |
| **Auth** | JWT via djangorestframework-simplejwt |
| **Database** | PostgreSQL |
| **AI Engine** | Groq API (LLaMA 3.3 70B Versatile) |
| **Frontend** | React 19 + Vite + TailwindCSS 4 |
| **State** | Zustand (persisted to localStorage) |
| **HTTP Client** | Axios (JWT interceptors + auto-refresh) |
| **Animations** | Framer Motion |
| **Payments** | Paystack (GHS 20/month) |
| **Email** | Gmail SMTP |

---

## Features

### Free Tier
- 1 full 7-day AI-generated Ghanaian meal plan
- 1 3-day preview plan (days 4-7 blurred)
- Save 1 meal plan
- Meal ratings (1-5 stars)
- Goal estimate (weeks/months to target weight)
- BMI calculator + daily calorie and water targets
- In-app notification bell

### Premium Tier (GHS 20/month)
- Unlimited 7-day plan generations
- AI taste learning (ratings shape future Groq prompts)
- Unlimited saved plans
- Weekly nutrition summary email (every Sunday)
- All upcoming features: health streaks, PDF export, snack suggestions

---

## Project Structure

```
NourishAI/
  NourishAI/                      Django project root (manage.py lives here)
    api/                          DRF app: all REST endpoints
      views.py                    All API view functions
      serializers.py              DRF serializers
      urls.py                     URL patterns for /api/
    users/                        UserProfile model + forms
      models.py
      migrations/                 0001-0008
    meals/                        MealPlan, Meal, ShoppingList, Notification models
      models.py
      groq_service.py             Groq prompt builder + JSON parser
      unsplash_service.py         Dormant image fetcher
      management/commands/
        send_weekly_summary.py    Management command for weekly emails
      migrations/                 0001-0009
    emails.py                     All outgoing email functions
    notifications.py              In-app notification helpers
    frontend/                     React SPA (Vite)
      src/
        App.jsx                   Router + PrivateRoute / PublicRoute / OnboardingRoute guards
        main.jsx
        index.css                 Global CSS + utility classes (.card, .btn-primary, .input etc.)
        api/client.js             Axios instance + authAPI / profileAPI / mealsAPI / upgradeAPI
        store/authStore.js        Zustand: user, isAuthenticated, onboardingComplete, subscriptionTier
        pages/
          LoginPage.jsx
          RegisterPage.jsx
          VerifyOTPPage.jsx       6-box OTP input, countdown timer, resend button
          ForgotPasswordPage.jsx
          ResetPasswordPage.jsx
          OnboardingPage.jsx      3-step flow with live BMI preview
          DashboardPage.jsx
          GeneratePlanPage.jsx
          MealPlanPage.jsx
          HistoryPage.jsx
          ProfilePage.jsx
          UpgradePage.jsx
          UpgradeSuccessPage.jsx
        components/
          layout/AppLayout.jsx    Sidebar + topbar shell (responsive, mobile hamburger)
          ui/NotificationBell.jsx Bell + dropdown, polls /api/notifications/ every 30s
          ui/ConfirmModal.jsx     Reusable confirm dialog
      vite.config.js              Dev proxy: /api -> http://localhost:8000
      package.json
    requirements.txt
    manage.py
    README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Groq API key (free at console.groq.com)
- Paystack account (test keys from paystack.com)
- Gmail App Password

### Backend

```bash
# From NourishAI/ (where manage.py is)
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
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
EMAIL_HOST_USER=youremail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
UNSPLASH_ACCESS_KEY=optional
```

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver        # runs at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                       # runs at http://localhost:5173
```

Vite proxies all `/api/*` requests to Django automatically.

---

## API Reference

All endpoints under `/api/`. JWT Bearer token required where marked.

### Auth
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register/` | No | Validates data, stores in session, sends OTP email |
| POST | `/auth/verify-otp/` | No | Confirms OTP, creates User + UserProfile, returns JWT |
| POST | `/auth/resend-otp/` | No | Re-generates OTP, updates session, resends email |
| POST | `/auth/login/` | No | Returns JWT tokens + onboarding_complete + subscription_tier |
| POST | `/auth/token/refresh/` | No | Refresh JWT access token |
| POST | `/auth/forgot-password/` | No | Sends reset link to email |
| POST | `/auth/reset-password/` | No | Accepts uid + token + new_password |

### Profile & Onboarding
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/profile/` | Yes | Full profile + generation_status + can_save |
| PATCH | `/profile/update/` | Yes | Partial update any profile field |
| POST | `/onboarding/step1/` | Yes | age, height, weight |
| POST | `/onboarding/step2/` | Yes | dietary_preference, allergies, health_conditions |
| POST | `/onboarding/step3/` | Yes | region, fitness_goal, budget. Sets onboarding_complete=True |

### Meal Plans
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/dashboard/` | Yes | profile, latest_plan, saved_plans, goal_estimate |
| POST | `/plans/generate/` | Yes | AI generation; returns 403 if blocked |
| GET | `/plans/` | Yes | History: saved OR created within 7 days |
| GET | `/plans/<pk>/` | Yes | Full plan: meals + shopping_list + show_lock + can_save |
| DELETE | `/plans/<pk>/delete/` | Yes | Hard delete |
| POST | `/plans/<pk>/save/` | Yes | { title? }. Sends save-limit email + notification if blocked |
| POST | `/plans/<pk>/unsave/` | Yes | Sets is_saved=False |
| POST | `/meals/<pk>/regenerate/` | Yes | Calls Groq for 1 replacement meal |
| POST | `/meals/<pk>/rate/` | Yes | { rating: 1-5 } |

### Upgrade / Paystack
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/upgrade/checkout/` | Yes | Returns Paystack authorization_url |
| GET | `/upgrade/success/?reference=...` | Yes | Verifies payment, sets premium, sends upgrade email |
| POST | `/upgrade/cancel/` | Yes | Disables Paystack subscription, reverts to free |
| POST | `/webhook/paystack/` | No | HMAC-verified. Handles charge.success, subscription events, invoice.payment_failed |

### Notifications
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/notifications/` | Yes | Last 30, includes unread_count |
| POST | `/notifications/read-all/` | Yes | Bulk mark read |
| POST | `/notifications/<pk>/read/` | Yes | Single mark read |

---

## Management Commands

```bash
# Send weekly nutrition summary emails to all active Premium users
# Schedule with cron: every Sunday at 7 PM
python manage.py send_weekly_summary
```

---

## Production Checklist

- [ ] Set `ALLOWED_HOSTS` in settings
- [ ] Update hardcoded `localhost:5173` in `api/views.py` (Paystack callback URL + password reset link)
- [ ] Run `npm run build` in `frontend/` and serve `dist/` via Django or a CDN
- [ ] Set `DEBUG=False` and configure `STATIC_ROOT`
- [ ] Register Paystack webhook URL: `https://yourdomain.com/api/webhook/paystack/`
- [ ] Set up cron job for `send_weekly_summary`