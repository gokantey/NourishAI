import os
import json
from groq import Groq
from django.utils import timezone

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

REGION_FOOD_NOTES = {
    'greater_accra': 'The user is from Greater Accra. Favour coastal dishes — kenkey with fried fish, waakye, chichinga, kelewele, and popular Accra street foods.',
    'ashanti': 'The user is from the Ashanti region. Favour fufu with palm nut soup or groundnut soup, kontomire stew, ampesi with garden egg stew, and Ashanti-style chicken dishes.',
    'western': 'The user is from the Western region. Favour fresh seafood, palm nut soup, abenkwan, plantain-based dishes, and coastal fish preparations.',
    'central': 'The user is from the Central region. Favour fante fante (fante kenkey), fante soup, fresh tilapia, and coastal Fante dishes.',
    'eastern': 'The user is from the Eastern region. Favour fufu with light soup, palmnut soup, garden egg stew, and locally grown vegetables.',
    'volta': 'The user is from the Volta region. Favour akple with fetri detsi (okra soup), abolo, grilled tilapia, and Ewe traditional dishes.',
    'oti': 'The user is from the Oti region. Favour yam-based dishes, light soups, grilled fish, and dishes common in the Volta basin area.',
    'northern': 'The user is from the Northern region. Favour tuo zaafi with ayoyo soup, groundnut soup, zom koom (guinea corn porridge), tubaani (bean pudding), and smoked fish dishes.',
    'savannah': 'The user is from the Savannah region. Favour tuo zaafi, ayoyo soup, groundnut-based stews, millet porridge, and Northern Ghanaian staples.',
    'north_east': 'The user is from the North East region. Favour tuo zaafi, ayoyo soup, zom koom, groundnut soup, and Northern staples with locally grown grains.',
    'upper_east': 'The user is from the Upper East region. Favour tuo zaafi, ayoyo soup, zom koom, tubaani, groundnut soup, and Upper East traditional dishes.',
    'upper_west': 'The user is from the Upper West region. Favour tuo zaafi, ayoyo soup, millet-based porridges, groundnut dishes, and traditional Upper West staples.',
    'bono': 'The user is from the Bono region. Favour fufu with palm nut soup, kontomire stew, yam dishes, and Brong-Ahafo style cooking.',
    'bono_east': 'The user is from the Bono East region. Favour fufu, groundnut soup, yam-based dishes, and Brong-Ahafo regional cuisine.',
    'ahafo': 'The user is from the Ahafo region. Favour fufu with palm nut or groundnut soup, kontomire, and forest-zone Ghanaian dishes.',
    'western_north': 'The user is from the Western North region. Favour palm nut soup, fufu, fresh forest-zone vegetables, and Western North traditional cooking.',
}

AGE_NUTRITION_NOTES = {
    'teen': 'The user is a teenager (under 18). They are still growing — prioritise calcium-rich foods (fish with bones, leafy greens), iron-rich foods (beans, lean meat), and adequate protein for growth. Avoid very low-calorie meals.',
    'young_adult': 'The user is a young adult (18–35). They likely have an active lifestyle. Prioritise balanced macros, high protein for muscle maintenance, and complex carbohydrates for sustained energy.',
    'mid_adult': 'The user is a mid-aged adult (36–50). Metabolism is slowing slightly — increase fibre, lean protein, and vegetables. Reduce refined carbohydrates and heavy fried foods.',
    'senior': 'The user is an older adult (51+). Prioritise easily digestible meals, bone health (calcium and vitamin D from fish and leafy greens), lower sodium, and lighter portion sizes. Avoid very heavy or greasy meals.',
}

HEALTH_CONDITION_RULES = {
    'type1_diabetes': """
DIETARY RULES FOR TYPE 1 DIABETES:
- Focus on consistent, predictable carbohydrate intake at every meal to support insulin dosing
- Do not eliminate carbohydrates — use consistent portions of complex carbs: oats, yam, plantain, brown rice, legumes
- Avoid large spikes from refined sugars and sugary drinks
- Always pair carbohydrates with protein and fat to slow glucose absorption
- Include fibre-rich foods at every meal — vegetables, beans, leafy greens
- Avoid skipping meals — regular meal timing is critical for insulin management
- Keep portion sizes consistent day to day
- Avoid alcohol and sugary soft drinks
""",
    'type2_diabetes': """
DIETARY RULES FOR TYPE 2 DIABETES:
- Strictly avoid high glycaemic index foods: white rice in large portions, white bread, sugary drinks, sweets, and heavily sweetened porridges
- Favour low GI carbohydrates: oats, brown rice, yam, plantain in small portions, legumes, and vegetables
- Include high-fibre foods at every meal — vegetables, beans, kontomire, garden eggs
- Avoid adding sugar to meals or drinks
- Keep portions of starchy foods small and always pair with protein and vegetables
- Avoid fruit juices — whole fruits in moderation are fine
- Prefer grilled, boiled, or steamed cooking over fried
- Avoid sweetened condensed milk, sugary bofrot, and very sweet pastries
""",
    'hypertension': """
DIETARY RULES FOR HYPERTENSION (HIGH BLOOD PRESSURE):
- Keep sodium very low — avoid added salt, stock cubes, and salty seasonings where possible
- Avoid processed and heavily salted foods
- Limit palm oil use — prefer light soups, steamed, grilled, or tomato-based stews
- Include potassium-rich foods: bananas, avocado, leafy greens, beans, sweet potatoes
- Include magnesium-rich foods: leafy vegetables, legumes
- Avoid smoked or salted fish as a primary protein — prefer fresh fish
- Limit red meat — favour chicken, fish, and plant proteins
- Avoid very heavy oily meals
""",
    'high_cholesterol': """
DIETARY RULES FOR HIGH CHOLESTEROL:
- Avoid saturated fats — limit palm oil, coconut oil, fatty red meat, and full-fat dairy
- Favour unsaturated fats — include avocado and oily fish like sardines or mackerel
- Include soluble fibre at every meal — oats, beans, lentils, vegetables
- Avoid fried foods — prefer grilled, boiled, baked, or steamed
- Include omega-3 rich foods: fresh tilapia, mackerel, sardines, and tuna
- Avoid processed meats and organ meats like offal
- Include plenty of vegetables and legumes
""",
    'hypothyroidism': """
DIETARY RULES FOR HYPOTHYROIDISM:
- Include iodine-rich foods: fish, seafood, eggs
- Avoid large amounts of raw goitrogenic foods — raw cassava, raw cabbage, raw broccoli (cooked versions are fine in moderation)
- Include selenium-rich foods: fish, eggs, legumes
- Include zinc-rich foods: meat, beans, pumpkin seeds
- Avoid highly processed foods and refined sugars
- Keep fibre intake high to combat constipation
""",
    'hyperthyroidism': """
DIETARY RULES FOR HYPERTHYROIDISM:
- Avoid excess iodine — limit very high-iodine foods
- Include calcium and vitamin D-rich foods: fish with bones, leafy greens, eggs
- Include antioxidant-rich foods: colourful vegetables, tomatoes, garden eggs
- Ensure adequate calorie intake — hyperthyroidism increases metabolic rate
- Include magnesium-rich foods: leafy greens, legumes
- Avoid caffeine as it can worsen heart palpitations
""",
    'fatty_liver': """
DIETARY RULES FOR FATTY LIVER:
- Strictly avoid alcohol
- Avoid added sugars and fructose — no sugary drinks, sweets, or sweetened condensed milk
- Avoid saturated and trans fats — limit palm oil, fried foods, and fatty meats
- Favour complex carbohydrates: oats, brown rice, yam, vegetables
- Include liver-supportive foods: leafy greens, garlic, onions
- Include healthy fats in small amounts: avocado, oily fish
- Increase fibre: beans, lentils, vegetables at every meal
- Favour lean proteins: fish, chicken breast, eggs, legumes
""",
    'gout': """
DIETARY RULES FOR GOUT:
- Avoid high-purine foods: organ meats (offal, liver, kidney), anchovies, sardines, mackerel, shellfish, red meat in large quantities
- Avoid alcohol entirely
- Stay very well hydrated
- Limit fructose — avoid sugary drinks and large amounts of fruit juice
- Safe proteins: eggs, chicken breast, tofu, legumes
- Favour alkaline-forming foods: most vegetables and some fruits
""",
    'anaemia': """
DIETARY RULES FOR ANAEMIA:
- Prioritise iron-rich foods at every meal: lean red meat, liver (in moderation), beans, lentils, dark leafy greens (kontomire, ayoyo), fortified cereals
- Pair iron-rich foods with vitamin C sources: tomatoes, garden eggs, oranges, peppers
- Avoid tea or coffee immediately after meals
- Include folate-rich foods: leafy greens, beans, groundnuts, eggs
- Include vitamin B12 sources: eggs, fish, lean meat
""",
    'sickle_cell': """
DIETARY RULES FOR SICKLE CELL DISEASE:
- Ensure high calorie intake — sickle cell increases energy demands
- Include high folate foods at every meal: leafy greens (kontomire, ayoyo), beans, groundnuts, eggs
- Include antioxidant-rich foods: colourful vegetables, tomatoes, garden eggs, fruits
- Stay very well hydrated — dehydration is a major trigger for sickle cell crises
- Include zinc-rich foods: meat, beans, pumpkin seeds
- Avoid very cold foods and drinks
- Include omega-3 rich foods: fresh fish, sardines
- Avoid alcohol entirely
""",
    'hiv_aids': """
DIETARY RULES FOR HIV/AIDS:
- Ensure high protein intake at every meal: fish, chicken, eggs, beans, legumes
- Ensure high calorie intake — HIV increases metabolic demands
- Include antioxidant-rich foods at every meal: colourful vegetables, tomatoes, leafy greens, fruits
- Include zinc-rich foods: meat, beans, pumpkin seeds
- Include selenium-rich foods: fish, eggs
- Prioritise food safety — thoroughly cook all proteins
- Include vitamin A-rich foods: sweet potatoes, carrots, leafy greens, eggs
- Stay well hydrated
- Avoid alcohol
""",
    'celiac_disease': """
DIETARY RULES FOR CELIAC DISEASE:
- Strictly avoid all gluten — no wheat, barley, or rye in any form
- Avoid regular bread, pasta, wheat-based bofrot, and wheat flour in any dish
- Safe Ghanaian staples: rice, yam, cassava, plantain, millet, sorghum, corn (banku from corn dough is safe)
- Fufu from cassava is safe — check preparation methods
- Avoid regular soy sauce and most processed seasonings which contain hidden gluten
""",
    'lactose_intolerance': """
DIETARY RULES FOR LACTOSE INTOLERANCE:
- Avoid all dairy products: milk, cheese, butter, yoghurt, cream
- Do not use milk in porridges, tea, or cooking
- Ensure calcium from other sources: fish with small bones (sardines), leafy greens, beans
- Check ingredients in bread and baked goods for hidden dairy
""",
    'gastritis': """
DIETARY RULES FOR GASTRITIS / ACID REFLUX:
- Avoid spicy foods, chilli peppers, and very peppery dishes
- Avoid very acidic foods: tomatoes in large amounts, citrus fruits, vinegar-based condiments
- Avoid fried and very fatty foods
- Avoid caffeine and carbonated drinks
- Favour smaller meals — oats, boiled yam, boiled plantain, lean proteins
- Avoid alcohol entirely
- Avoid eating very late at night
""",
    'ibs': """
DIETARY RULES FOR IRRITABLE BOWEL SYNDROME (IBS):
- Favour easily digestible, gentle foods: white rice, boiled yam, boiled plantain, boiled eggs, grilled fish, cooked carrots
- Include soluble fibre: oats, cooked vegetables rather than raw
- Avoid very spicy foods
- Avoid alcohol and carbonated drinks
- Keep portions moderate
- Stay well hydrated
""",
    'kidney_disease': """
DIETARY RULES FOR KIDNEY DISEASE:
- Keep protein intake moderate — avoid very high protein meals
- Limit potassium-rich foods in advanced stages: bananas, avocado, potatoes, tomatoes in large amounts
- Limit phosphorus: avoid processed foods, canned goods, cola drinks
- Keep sodium very low — no added salt, avoid stock cubes
- Favour white rice, vegetables, and controlled portions of lean protein
""",
    'pcos': """
DIETARY RULES FOR PCOS:
- Favour low glycaemic index foods: oats, legumes, vegetables, yam over white rice
- Include anti-inflammatory foods: leafy greens, tomatoes, fatty fish, groundnuts
- Avoid refined carbohydrates and added sugars
- Include high-fibre foods at every meal
- Include lean proteins at every meal: eggs, fish, chicken, beans
- Include zinc-rich foods: pumpkin seeds, beans, meat
""",
    'asthma': """
DIETARY RULES FOR ASTHMA:
- Include anti-inflammatory foods at every meal: oily fish, leafy greens, tomatoes, garden eggs, colourful vegetables
- Include magnesium-rich foods: leafy greens, beans, legumes
- Include vitamin D-rich foods: eggs, oily fish
- Include vitamin C-rich foods: tomatoes, peppers, garden eggs
- Avoid sulphite-containing foods: dried fruits, some processed meats
- Avoid very cold foods and drinks
- Avoid alcohol
- Keep well hydrated
""",
    'heart_disease': """
DIETARY RULES FOR HEART DISEASE:
- Strictly limit saturated fats — avoid fatty red meat, palm oil in large amounts, full-fat dairy
- Include heart-healthy omega-3 fats: oily fish (mackerel, sardines, tuna, tilapia), avocado
- Include soluble fibre at every meal: oats, beans, lentils, vegetables
- Keep sodium very low — no added salt, avoid stock cubes
- Avoid fried foods entirely — prefer grilled, steamed, baked, or boiled
- Include antioxidant-rich vegetables and fruits at every meal
- Avoid alcohol
- Keep portions moderate
- Favour lean proteins: fish, chicken breast, legumes, eggs
""",
    'stroke_history': """
DIETARY RULES FOR STROKE HISTORY:
- Keep sodium very low
- Avoid saturated fats and fried foods
- Include potassium-rich foods: leafy greens, beans, plantain
- Include omega-3 rich foods: oily fish
- Include antioxidant-rich colourful vegetables and fruits
- Avoid alcohol entirely
- Keep portions moderate
- Include high-fibre foods
""",
    'cancer': """
DIETARY RULES FOR CANCER (GENERAL):
- Prioritise nutrient-dense, high-calorie foods if appetite is low
- Include high-quality protein at every meal: eggs, fish, chicken, legumes
- Include antioxidant-rich foods: colourful vegetables, leafy greens, tomatoes, garden eggs, fruits
- Include anti-inflammatory foods: oily fish, avocado, leafy greens
- Avoid processed meats, smoked meats, and heavily charred or burnt foods
- Avoid alcohol entirely
- Prioritise food safety — thoroughly cook all proteins
- Keep meals gentle and easy to digest if experiencing nausea
- Stay well hydrated
""",
    'osteoporosis': """
DIETARY RULES FOR OSTEOPOROSIS:
- Prioritise calcium-rich foods at every meal: fish with small bones (sardines, anchovies), leafy greens, beans
- Include vitamin D-rich foods: eggs, oily fish
- Include magnesium-rich foods: leafy greens, legumes
- Include vitamin K-rich foods: leafy greens (kontomire, ayoyo)
- Avoid excess sodium which increases calcium loss
- Avoid alcohol
- Include adequate protein: fish, eggs, legumes
""",
    'arthritis': """
DIETARY RULES FOR ARTHRITIS:
- Include anti-inflammatory foods at every meal: oily fish, leafy greens, tomatoes, colourful vegetables
- Include omega-3 rich foods: fresh fish
- Include antioxidant-rich fruits and vegetables: garden eggs, tomatoes, peppers, leafy greens
- Avoid pro-inflammatory foods: fried foods, processed foods, refined sugars, excess red meat
- Include turmeric and ginger where possible — both have natural anti-inflammatory properties common in Ghanaian cooking
- Avoid alcohol
- Include vitamin C-rich foods: tomatoes, peppers
""",
}


def get_age_note(age):
    if age is None:
        return ''
    if age < 18:
        return AGE_NUTRITION_NOTES['teen']
    elif age <= 35:
        return AGE_NUTRITION_NOTES['young_adult']
    elif age <= 50:
        return AGE_NUTRITION_NOTES['mid_adult']
    else:
        return AGE_NUTRITION_NOTES['senior']


def get_health_condition_rules(health_conditions, other_health_condition=''):
    rules = []
    if health_conditions:
        for condition in health_conditions:
            if condition in HEALTH_CONDITION_RULES:
                rules.append(HEALTH_CONDITION_RULES[condition])
    if other_health_condition and other_health_condition.strip():
        rules.append(f"""
ADDITIONAL HEALTH CONDITION REPORTED BY USER:
The user has reported the following health condition: "{other_health_condition.strip()}"
As a professional nutritionist, apply appropriate dietary guidance for this condition using your medical knowledge.
Avoid foods that are commonly contraindicated for this condition and favour foods that support its management.
""")
    return '\n'.join(rules)


def get_allergy_summary(allergies, other_allergy=''):
    all_allergies = list(allergies) if allergies else []
    if other_allergy and other_allergy.strip():
        all_allergies.append(f"other: {other_allergy.strip()}")
    return ', '.join(all_allergies) if all_allergies else 'None'


def generate_meal_plan(profile, liked_meals=None, disliked_meals=None):
    region_note = REGION_FOOD_NOTES.get(profile.region, '') if profile.region else ''
    age_note = get_age_note(profile.age)
    health_rules = get_health_condition_rules(
        profile.health_conditions,
        getattr(profile, 'other_health_condition', '')
    )
    allergy_summary = get_allergy_summary(
        profile.allergies,
        getattr(profile, 'other_allergy', '')
    )

    prompt = f"""
You are a professional nutritionist and meal planning expert specializing in Ghanaian cuisine and West African food culture.
Generate meals that are primarily Ghanaian and West African — dishes like waakye, jollof rice, banku, fufu, kenkey, kontomire stew, garden egg stew, groundnut soup, light soup, kelewele, omo tuo, tuo zaafi, red red, abenkwan, and similar traditional Ghanaian meals. You may include West African regional dishes, continental options, and creative fusion meals using locally available Ghanaian ingredients. Be creative — do not default to the same dishes every time.

Generate a detailed 7-day meal plan for a person with the following profile:
- Name: {profile.user.first_name}
- Age: {profile.age if profile.age else 'Not specified'}
- Region: {profile.get_region_display() if profile.region else 'Not specified'}
- Height: {profile.height}cm
- Weight: {profile.weight}kg
- BMI: {profile.bmi} ({profile.bmi_category})
- Daily Calorie Target: {profile.daily_calorie_target} kcal
- Daily Water Intake Target: {profile.daily_water_intake}L
- Dietary Preference: {profile.dietary_preference}
- Allergies (NEVER include these in any meal): {allergy_summary}
- Health Conditions: {', '.join(profile.health_conditions) if profile.health_conditions else 'None'}
- Other Health Condition: {profile.other_health_condition if getattr(profile, 'other_health_condition', '') else 'None'}
- Fitness Goal: {profile.fitness_goal}
- Weekly Budget: ₵{profile.budget}
- Generation timestamp (use this to vary your output): {timezone.now()}
"""

    if region_note:
        prompt += f"\nREGIONAL FOOD PREFERENCE:\n{region_note}\n"

    if age_note:
        prompt += f"\nAGE-BASED NUTRITION GUIDANCE:\n{age_note}\n"

    if health_rules:
        prompt += f"\nHEALTH CONDITION DIETARY RULES — THESE ARE MANDATORY AND OVERRIDE OTHER SUGGESTIONS:\n{health_rules}\n"

    prompt += """
STRICT RULES:
1. NEVER include any ingredient the person is allergic to — this includes both listed allergies and any other allergy they described
2. Respect their dietary preference strictly
3. Follow all health condition dietary rules above without exception
4. Each meal must hit their daily calorie target across breakfast, lunch and dinner
5. Keep meals within their weekly budget
6. Provide realistic prep times
7. Vary meals across the 7 days — no repetition whatsoever
8. For portion_guide, give a practical human-readable description using household measures
9. Be creative — mix Ghanaian classics with West African regional dishes and creative options
10. Vary proteins, cooking methods, and cuisine influences across the 7 days
11. Do NOT repeat the same weekly structure each time
12. For suggested_time: Breakfast 6–9 AM, Lunch 12–2 PM, Dinner 6–9 PM

Follow these strict Ghanaian food pairing rules:
- Fufu is ONLY served with light soup, groundnut soup, or palm nut soup. Never with stew.
- Banku is ONLY served with okra stew, tilapia, pepper sauce, or soup.
- Kenkey is ONLY served with fried fish, pepper sauce, or shito. Never with soup.
- Omo tuo is ONLY served with groundnut soup or palm nut soup.
- Tuo zaafi is ONLY served with ayoyo soup or groundnut soup.
- Waakye can be served with fried fish, boiled egg, spaghetti, wele, shito, and stew.
- Jollof rice, fried rice, and plain rice go with stew, chicken, fish, or beef — never with soup.
- Kelewele is a snack or side dish — never a standalone main meal.
- Red red is served with fried plantain and/or gari.

Follow these strict Ghanaian meal timing rules:
- BREAKFAST: hausa koko, tom brown, oats, eggs with bread or yam, light porridge, akara, bofrot, or simple continental options only.
- NEVER put fufu, banku, kenkey, jollof, waakye, omo tuo, tuo zaafi, or heavy soup-based meals at breakfast.
- LUNCH and DINNER: all heavy Ghanaian dishes are appropriate.
"""

    if profile.fitness_goal == 'lose_weight':
        prompt += "\nWEIGHT LOSS GUIDELINES: Keep each meal under 500 calories. High protein, high fibre, low fat. Prefer grilled, steamed, or boiled. Daily total close to 1800 kcal.\n"
    elif profile.fitness_goal == 'build_muscle':
        prompt += "\nMUSCLE BUILDING GUIDELINES: Calorie-dense meals, high protein at every meal, complex carbohydrates. Daily total close to 3000 kcal.\n"
    elif profile.fitness_goal == 'maintain':
        prompt += "\nMAINTENANCE GUIDELINES: Balanced macronutrients, moderate portions. Daily total close to 2200 kcal.\n"

    if liked_meals:
        prompt += f"\nThe user highly rated these meals — include similar dishes: {', '.join(liked_meals)}."
    if disliked_meals:
        prompt += f"\nThe user rated these meals poorly — avoid entirely: {', '.join(disliked_meals)}."

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
          "suggested_time": "7:00 AM - 7:30 AM",
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
          "suggested_time": "12:30 PM - 1:30 PM",
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
          "suggested_time": "7:00 PM - 8:00 PM",
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
    region_note = REGION_FOOD_NOTES.get(profile.region, '') if profile.region else ''
    age_note = get_age_note(profile.age)
    health_rules = get_health_condition_rules(
        profile.health_conditions,
        getattr(profile, 'other_health_condition', '')
    )
    allergy_summary = get_allergy_summary(
        profile.allergies,
        getattr(profile, 'other_allergy', '')
    )

    prompt = f"""
You are a professional nutritionist specializing in Ghanaian cuisine and West African food culture.

Generate ONE new {meal_type} meal for {day} for this person:
- Age: {profile.age if profile.age else 'Not specified'}
- Region: {profile.get_region_display() if profile.region else 'Not specified'}
- Dietary Preference: {profile.dietary_preference}
- Allergies (NEVER include these): {allergy_summary}
- Health Conditions: {', '.join(profile.health_conditions) if profile.health_conditions else 'None'}
- Other Health Condition: {profile.other_health_condition if getattr(profile, 'other_health_condition', '') else 'None'}
- Fitness Goal: {profile.fitness_goal}
- Daily Calorie Target: {profile.daily_calorie_target} kcal
- Generation timestamp (use this to vary your output): {timezone.now()}
"""

    if region_note:
        prompt += f"\nREGIONAL FOOD PREFERENCE:\n{region_note}\n"
    if age_note:
        prompt += f"\nAGE-BASED NUTRITION GUIDANCE:\n{age_note}\n"
    if health_rules:
        prompt += f"\nHEALTH CONDITION DIETARY RULES — MANDATORY:\n{health_rules}\n"

    prompt += f"""
The meal must be COMPLETELY different from these already in their plan: {existing}

SWAP RULES:
- Do not suggest any variation of the same dish
- Do not suggest the same protein prepared differently
- Pick a completely different dish from a different food category entirely
- Be creative — West African, continental, or Asian-inspired dishes using local Ghanaian ingredients are welcome
- For suggested_time: breakfast 6–9 AM, lunch 12–2 PM, dinner 6–9 PM
"""

    if profile.fitness_goal == 'lose_weight':
        prompt += "Keep this meal under 500 calories. High protein, high fibre, low fat. Prefer grilled, steamed, or boiled.\n"
    elif profile.fitness_goal == 'build_muscle':
        prompt += "Make this meal calorie-dense and high in protein with complex carbohydrates.\n"

    prompt += f"""
Respond ONLY with a valid JSON object, no extra text:
{{
  "meal_type": "{meal_type}",
  "title": "Meal name",
  "description": "Brief description",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step by step cooking instructions",
  "portion_guide": "e.g. 1 medium plate of rice with 1 piece of grilled fish",
  "suggested_time": "7:00 AM - 8:00 AM",
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