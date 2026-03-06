import os
import json
from groq import Groq

client = Groq(api_key=os.getenv('GROQ_API_KEY'))


def generate_meal_plan(profile, liked_meals=None, disliked_meals=None):
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

Follow these strict Ghanaian food pairing rules:
- Fufu is ONLY served with light soup, groundnut soup (nkate nkwan), or palm nut soup (abenkwan). Never pair fufu with stew.
- Banku is ONLY served with okra stew, tilapia, pepper sauce, or soup.
- Kenkey is ONLY served with fried fish, pepper sauce, or shito. Never pair kenkey with soup.
- Omo tuo (rice balls) is ONLY served with groundnut soup or palm nut soup.
- Tuo zaafi is ONLY served with ayoyo soup or groundnut soup.
- Waakye can be served with any combination of fried fish, boiled egg, spaghetti, wele, shito, and stew.
- Jollof rice, fried rice, and plain rice go with stew, chicken, fish, or beef — never with soup.
- Kelewele is a snack or side dish — never a standalone main meal.
- Red red (bean stew) is served with fried plantain and/or gari.
- Do NOT invent unusual pairings. Stick to combinations that are actually eaten in Ghana.

Follow these strict Ghanaian meal timing rules:
- BREAKFAST must only include: hausa koko with koose or bread, tom brown, oats, tea with bread, eggs (boiled/fried/scrambled) with bread or yam, oblayo, ababubu, corn porridge, mashed plantain with eggs, akara, bofrot, light porridge, or simple continental breakfast options. 
- NEVER put fufu, banku, kenkey, jollof rice, waakye, omo tuo, tuo zaafi, or any heavy soup-based meal at breakfast. These are lunch or dinner foods only.
- LUNCH and DINNER can include all the heavy Ghanaian dishes — fufu with soup, banku with okra, waakye, jollof, kenkey with fish, red red, kontomire stew with yam, etc.
- DINNER can be slightly lighter than lunch but still a proper meal — grilled fish with rice, yam with stew, or similar.
- Apply common sense — breakfast should be light and quick, lunch and dinner should be the main substantial meals.

if liked_meals:
    prompt += f"\nThe user has previously rated these meals highly — try to include similar dishes or flavours: {', '.join(liked_meals)}."

if disliked_meals:
    prompt += f"\nThe user has rated these meals poorly — avoid these dishes entirely: {', '.join(disliked_meals)}."

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