import os
import json
from groq import Groq

client = Groq(api_key=os.getenv('GROQ_API_KEY'))


def generate_meal_plan(profile):
    prompt = f"""
You are a professional nutritionist and meal planning expert specializing in Ghanaian cuisine and West African food culture.
Generate meals that are primarily Ghanaian and West African — dishes like waakye, jollof rice, banku, fufu, kenkey, kontomire stew, garden egg stew, groundnut soup, light soup, kelewele, omo tuo, tuo zaafi, red red, abenkwan, and similar traditional Ghanaian meals. You may include a few international meals occasionally but the majority must be authentic Ghanaian dishes. Use locally available Ghanaian ingredients where possible.

Generate a detailed 7-day meal plan for a person with the following profile:
- Name: {profile.user.first_name}
- Height: {profile.height}cm
- Weight: {profile.weight}kg
- BMI: {profile.bmi} ({profile.bmi_category})
- Daily Calorie Target: {profile.daily_calorie_target} kcal
- Daily Water Intake Target: {profile.daily_water_intake}L
- Dietary Preference: {profile.dietary_preference}
- Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}
- Fitness Goal: {profile.fitness_goal}
- Weekly Budget: ₵{profile.budget}

STRICT RULES:
1. Never include ingredients the person is allergic to
2. Respect their dietary preference strictly
3. Each meal must hit their daily calorie target across breakfast, lunch and dinner
4. Keep meals within their weekly budget
5. Provide realistic prep times
6. Vary meals across the 7 days — no repetition

Respond ONLY with a valid JSON object in this exact format, no extra text:
{{
  "meal_plan": [
    {{
      "day": "monday",
      "meals": [
        {{
          "meal_type": "breakfast",
          "title": "Meal name",
          "description": "Brief description",
          "ingredients": ["ingredient 1", "ingredient 2"],
          "instructions": "Step by step cooking instructions",
          "prep_time": 15,
          "difficulty": "easy",
          "calories": 450,
          "protein": 25.0,
          "carbohydrates": 45.0,
          "fats": 12.0,
          "fibre": 6.0,
          "sugar": 8.0,
          "sodium": 320.0
        }},
        {{
          "meal_type": "lunch",
          ...
        }},
        {{
          "meal_type": "dinner",
          ...
        }}
      ]
    }},
    ... repeat for tuesday through sunday
  ],
  "shopping_list": [
    {{
      "ingredient_name": "Chicken breast",
      "quantity": "500",
      "unit": "g",
      "category": "proteins"
    }},
    ...
  ]
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=8000,
    )

    raw = response.choices[0].message.content
    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()

    return json.loads(clean)


def regenerate_single_meal(profile, day, meal_type, existing_meals):
    existing = ", ".join(existing_meals)

    prompt = f"""
You are a professional nutritionist specializing in Ghanaian cuisine and West African food culture. Generate authentic Ghanaian meals using locally available ingredients.

Generate ONE new {meal_type} meal for {day} for this person:
- Dietary Preference: {profile.dietary_preference}
- Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}
- Fitness Goal: {profile.fitness_goal}
- Daily Calorie Target: {profile.daily_calorie_target} kcal

The meal must be different from these already in their plan: {existing}

Respond ONLY with a valid JSON object, no extra text:
{{
  "meal_type": "{meal_type}",
  "title": "Meal name",
  "description": "Brief description",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step by step cooking instructions",
  "prep_time": 15,
  "difficulty": "easy",
  "calories": 450,
  "protein": 25.0,
  "carbohydrates": 45.0,
  "fats": 12.0,
  "fibre": 6.0,
  "sugar": 8.0,
  "sodium": 320.0
}}
"""

    response = client.chat.completions.create(
       model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content
    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()

    return json.loads(clean)