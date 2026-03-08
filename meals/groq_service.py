import os
import json
from groq import Groq
from django.utils import timezone

client = Groq(api_key=os.getenv('GROQ_API_KEY'))


def generate_meal_plan(profile, liked_meals=None, disliked_meals=None):
    prompt = f"""
You are a professional nutritionist and meal planning expert specializing in Ghanaian cuisine and West African food culture.
Generate meals that are primarily Ghanaian and West African — dishes like waakye, jollof rice, banku, fufu, kenkey, kontomire stew, garden egg stew, groundnut soup, light soup, kelewele, omo tuo, tuo zaafi, red red, abenkwan, and similar traditional Ghanaian meals. You may include West African regional dishes, continental options, and creative fusion meals using locally available Ghanaian ingredients. Be creative — do not default to the same dishes every time.

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
- Generation timestamp (use this to vary your output): {timezone.now()}

STRICT RULES:
1. Never include ingredients the person is allergic to
2. Respect their dietary preference strictly
3. Each meal must hit their daily calorie target across breakfast, lunch and dinner
4. Keep meals within their weekly budget
5. Provide realistic prep times
6. Vary meals across the 7 days — no repetition whatsoever
7. For portion_guide, give a practical human-readable description of exactly how much to eat — use household measures like bowls, cups, pieces, and tablespoons rather than just grams
8. Be creative and vary meals significantly — do not default to the same dishes every time. Mix Ghanaian classics with West African regional dishes, continental options, and creative fusion meals that still use locally available Ghanaian ingredients
9. Across the 7 days, ensure a wide variety of proteins (fish, chicken, beef, eggs, beans, turkey, tuna), cooking methods (grilled, steamed, boiled, fried, baked, stewed), and cuisine influences (Ghanaian, Nigerian, Senegalese, continental, Asian-inspired with local ingredients)
10. IMPORTANT: Imagine you are generating this plan for the first time with completely fresh ideas. Do NOT repeat the same weekly structure you may have used before.

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
"""

    if profile.fitness_goal == 'lose_weight':
        prompt += """
CALORIE AND MEAL GUIDELINES FOR WEIGHT LOSS:
- Keep each meal under 500 calories
- Prioritise high protein, high fibre, low fat meals
- Avoid heavy starchy meals like fufu, banku, or omo tuo as main dishes — use smaller portions or lighter alternatives
- Prefer grilled, steamed, or boiled cooking methods over fried
- Include plenty of vegetables in every meal
- Avoid heavy soups with palm oil as a base — prefer light soups or tomato-based stews
- Breakfast should be light — eggs, oats, fruit, or light porridge
- Keep daily total close to 1800 kcal
"""
    elif profile.fitness_goal == 'build_muscle':
        prompt += """
CALORIE AND MEAL GUIDELINES FOR MUSCLE BUILDING:
- Each meal should be calorie-dense and high in protein
- Include protein in every meal — eggs, chicken, fish, beans, beef
- Include complex carbohydrates — rice, yam, plantain, oats
- Post-workout meals should be high protein and moderate carb
- Keep daily total close to 3000 kcal
"""
    elif profile.fitness_goal == 'maintain':
        prompt += """
CALORIE AND MEAL GUIDELINES FOR WEIGHT MAINTENANCE:
- Balance macronutrients across all meals
- Moderate portions — not too heavy, not too light
- Mix of proteins, carbohydrates, and healthy fats
- Keep daily total close to 2200 kcal
"""

    if liked_meals:
        prompt += f"\nThe user has previously rated these meals highly — try to include similar dishes or flavours: {', '.join(liked_meals)}."

    if disliked_meals:
        prompt += f"\nThe user has rated these meals poorly — avoid these dishes entirely: {', '.join(disliked_meals)}."

    prompt += """

Respond ONLY with a valid JSON object in this exact format, no extra text:
{
  "meal_plan": [
    {
      "day": "monday",
      "meals": [
        {
          "meal_type": "breakfast",
          "title": "Meal name",
          "description": "Brief description",
          "ingredients": ["ingredient 1", "ingredient 2"],
          "instructions": "Step by step cooking instructions",
          "portion_guide": "e.g. 2 eggs with 2 slices of bread and 1 cup of tea",
          "prep_time": 15,
          "difficulty": "easy",
          "calories": 450,
          "protein": 25.0,
          "carbohydrates": 45.0,
          "fats": 12.0,
          "fibre": 6.0,
          "sugar": 8.0,
          "sodium": 320.0
        },
        {
          "meal_type": "lunch",
          "title": "...",
          "description": "...",
          "ingredients": [],
          "instructions": "...",
          "portion_guide": "e.g. 1 medium ball of fufu with 1 bowl of groundnut soup",
          "prep_time": 30,
          "difficulty": "medium",
          "calories": 700,
          "protein": 35.0,
          "carbohydrates": 80.0,
          "fats": 18.0,
          "fibre": 8.0,
          "sugar": 5.0,
          "sodium": 450.0
        },
        {
          "meal_type": "dinner",
          "title": "...",
          "description": "...",
          "ingredients": [],
          "instructions": "...",
          "portion_guide": "e.g. 1 medium plate of rice with 1 piece of grilled chicken",
          "prep_time": 25,
          "difficulty": "easy",
          "calories": 550,
          "protein": 30.0,
          "carbohydrates": 60.0,
          "fats": 14.0,
          "fibre": 7.0,
          "sugar": 4.0,
          "sodium": 380.0
        }
      ]
    }
  ],
  "shopping_list": [
    {
      "ingredient_name": "Chicken breast",
      "quantity": "500",
      "unit": "g",
      "category": "proteins"
    }
  ]
}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.9,
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
You are a professional nutritionist specializing in Ghanaian cuisine and West African food culture. Generate creative meals using locally available ingredients — you can draw from Ghanaian, West African, continental, and Asian-inspired cooking as long as ingredients are locally available.

Generate ONE new {meal_type} meal for {day} for this person:
- Dietary Preference: {profile.dietary_preference}
- Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}
- Fitness Goal: {profile.fitness_goal}
- Daily Calorie Target: {profile.daily_calorie_target} kcal
- Generation timestamp (use this to vary your output): {timezone.now()}

The meal must be COMPLETELY different from these already in their plan: {existing}

SWAP RULES:
- Do not suggest any variation of the same dish (e.g. if the current meal is jollof rice, do not suggest fried rice, waakye, or any rice dish)
- Do not suggest the same protein prepared differently (e.g. if the current meal has tilapia, do not suggest grilled tilapia or fried tilapia)
- Pick a completely different dish from a different food category entirely
- Be creative — you can suggest West African regional dishes, continental meals, or Asian-inspired dishes using local Ghanaian ingredients
- The replacement must feel like a genuine alternative, not a minor variation
"""

    if profile.fitness_goal == 'lose_weight':
        prompt += """
WEIGHT LOSS RULES FOR THIS MEAL:
- Keep this meal under 500 calories
- High protein, high fibre, low fat
- Prefer grilled, steamed, or boiled over fried
- No heavy starchy dishes
"""
    elif profile.fitness_goal == 'build_muscle':
        prompt += """
MUSCLE BUILDING RULES FOR THIS MEAL:
- Make this meal calorie-dense and high in protein
- Include complex carbohydrates
- Protein sources: eggs, chicken, fish, beans, or beef
"""

    prompt += f"""
Respond ONLY with a valid JSON object, no extra text:
{{
  "meal_type": "{meal_type}",
  "title": "Meal name",
  "description": "Brief description",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step by step cooking instructions",
  "portion_guide": "e.g. 1 medium plate of rice with 1 piece of grilled fish",
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
        temperature=0.9,
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