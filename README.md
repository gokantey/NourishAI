# NourishAI 

A personalized AI-powered meal planning web application built with Django.
NourishAI generates customized 7-day meal plans, detailed recipes, and grouped
shopping lists based on the user's dietary preferences, allergies, BMI, budget,
and fitness goals.

## Features

- AI-generated 7-day meal plans powered by Groq (LLaMA 3)
- BMI calculator with personalized calorie and macro targets
- Grouped shopping lists by food category
- Detailed nutritional breakdown per meal
- Meal regeneration for meals you don't like
- Free and Premium subscription tiers via Paystack

## Tech Stack

- **Backend:** Django
- **Database:** PostgreSQL
- **AI Engine:** Groq API (LLaMA 3.3)
- **Frontend:** Bootstrap 5
- **Payments:** Paystack

## Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL
- Groq API key (free at console.groq.com)

### Installation

1. Clone the repository
   git clone https://github.com/yourusername/nourishai.git
   cd nourishai

2. Create and activate virtual environment
   python -m venv venv
   venv\Scripts\activate

3. Install dependencies
   pip install -r requirements.txt

4. Create a .env file in the project root
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   DB_NAME=nourishai_db
   DB_USER=nourishai_user
   DB_PASSWORD=yourpassword
   DB_HOST=localhost
   DB_PORT=5432
   GROQ_API_KEY=your-groq-api-key
   STRIPE_SECRET_KEY=your-stripe-secret-key

5. Set up the database
   python manage.py migrate

6. Create a superuser
   python manage.py createsuperuser

7. Run the development server
   python manage.py runserver

## Project Structure

nourishai/
├── users/          # Authentication and user profiles
├── meals/          # Meal plans, recipes, shopping lists
├── templates/      # HTML templates
├── static/         # CSS, JS, images
├── .env            # Environment variables (never commit)
├── .gitignore
├── requirements.txt
└── manage.py

## License
MIT
```

---

Project root:
```
nourishai/
├── nourishai/        ← Django project folder
├── users/            ← users app
├── meals/            ← meals app
├── venv/             ← virtual environment
├── manage.py
├── .env
├── .gitignore
├── requirements.txt
└── README.md