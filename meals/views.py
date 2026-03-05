from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from .models import MealPlan, Meal, ShoppingList, ShoppingListItem
from .groq_service import generate_meal_plan, regenerate_single_meal
import json


@login_required
def dashboard(request):
    profile = request.user.profile
    latest_plan = MealPlan.objects.filter(
        user_profile=profile
    ).order_by('-created_at').first()

    saved_plans = MealPlan.objects.filter(
        user_profile=profile,
        is_saved=True
    ).order_by('-created_at')

    goal_estimate = profile.calculate_goal_estimate()

    context = {
        'profile': profile,
        'latest_plan': latest_plan,
        'saved_plans': saved_plans,
        'goal_estimate': goal_estimate,
    }
    return render(request, 'meals/dashboard.html', context)


@login_required
def generate_plan(request):
    profile = request.user.profile

    if request.method == 'POST':
        try:
            messages.info(request, 'Generating your meal plan, please wait...')
            data = generate_meal_plan(profile)

            # Create MealPlan
            meal_plan = MealPlan.objects.create(
                user_profile=profile,
                week_start_date=timezone.now().date()
            )

            # Create Meals
            for day_data in data['meal_plan']:
                for meal_data in day_data['meals']:
                    Meal.objects.create(
                        meal_plan=meal_plan,
                        day=day_data['day'],
                        meal_type=meal_data['meal_type'],
                        title=meal_data['title'],
                        description=meal_data['description'],
                        ingredients=meal_data['ingredients'],
                        instructions=meal_data['instructions'],
                        prep_time=meal_data.get('prep_time', 0),
                        difficulty=meal_data.get('difficulty', 'easy'),
                        calories=meal_data.get('calories', 0),
                        protein=meal_data.get('protein', 0),
                        carbohydrates=meal_data.get('carbohydrates', 0),
                        fats=meal_data.get('fats', 0),
                        fibre=meal_data.get('fibre', 0),
                        sugar=meal_data.get('sugar', 0),
                        sodium=meal_data.get('sodium', 0),
                    )

            # Create ShoppingList and Items
            shopping_list = ShoppingList.objects.create(meal_plan=meal_plan)
            for item in data['shopping_list']:
                ShoppingListItem.objects.create(
                    shopping_list=shopping_list,
                    ingredient_name=item['ingredient_name'],
                    quantity=item['quantity'],
                    unit=item.get('unit', ''),
                    category=item.get('category', 'pantry'),
                )

            messages.success(request, 'Your meal plan is ready!')
            return redirect('meals:meal_plan_detail', pk=meal_plan.pk)

        except Exception as e:
            messages.error(request, f'Error generating meal plan: {str(e)}')
            return redirect('meals:dashboard')

    return render(request, 'meals/generate_plan.html')


@login_required
def meal_plan_detail(request, pk):
    meal_plan = get_object_or_404(MealPlan, pk=pk, user_profile=request.user.profile)
    meals = meal_plan.meals.all().order_by('day', 'meal_type')

    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    meal_types = ['breakfast', 'lunch', 'dinner']

    plan_grid = {}
    for day in days:
        plan_grid[day] = {}
        for mt in meal_types:
            plan_grid[day][mt] = meals.filter(day=day, meal_type=mt).first()

    try:
        shopping_list = meal_plan.shopping_list
        grouped_items = {}
        for item in shopping_list.items.all().order_by('category'):
            if item.category not in grouped_items:
                grouped_items[item.category] = []
            grouped_items[item.category].append(item)
    except:
        shopping_list = None
        grouped_items = {}

    # Weekly nutrition totals
    all_meals = meal_plan.meals.all()
    nutrition_totals = {
        'calories': sum(m.calories for m in all_meals),
        'protein': round(sum(m.protein for m in all_meals), 1),
        'carbohydrates': round(sum(m.carbohydrates for m in all_meals), 1),
        'fats': round(sum(m.fats for m in all_meals), 1),
        'fibre': round(sum(m.fibre for m in all_meals), 1),
    }

    context = {
        'meal_plan': meal_plan,
        'plan_grid': plan_grid,
        'days': days,
        'meal_types': meal_types,
        'shopping_list': shopping_list,
        'grouped_items': grouped_items,
        'nutrition_totals': nutrition_totals,
    }
    return render(request, 'meals/meal_plan_detail.html', context)


@login_required
def meal_detail(request, pk):
    meal = get_object_or_404(Meal, pk=pk, meal_plan__user_profile=request.user.profile)
    nutrition_data = [
        ('Protein', meal.protein, 'g'),
        ('Carbs', meal.carbohydrates, 'g'),
        ('Fats', meal.fats, 'g'),
        ('Fibre', meal.fibre, 'g'),
        ('Sugar', meal.sugar, 'g'),
        ('Sodium', meal.sodium, 'mg'),
    ]
    return render(request, 'meals/meal_detail.html', {'meal': meal, 'nutrition_data': nutrition_data})


@login_required
def regenerate_meal(request, pk):
    meal = get_object_or_404(Meal, pk=pk, meal_plan__user_profile=request.user.profile)
    profile = request.user.profile

    if request.method == 'POST':
        try:
            existing_meals = list(
                Meal.objects.filter(
                    meal_plan=meal.meal_plan
                ).exclude(pk=pk).values_list('title', flat=True)
            )

            new_meal_data = regenerate_single_meal(
                profile, meal.day, meal.meal_type, existing_meals
            )

            meal.title = new_meal_data['title']
            meal.description = new_meal_data['description']
            meal.ingredients = new_meal_data['ingredients']
            meal.instructions = new_meal_data['instructions']
            meal.prep_time = new_meal_data.get('prep_time', 0)
            meal.difficulty = new_meal_data.get('difficulty', 'easy')
            meal.calories = new_meal_data.get('calories', 0)
            meal.protein = new_meal_data.get('protein', 0)
            meal.carbohydrates = new_meal_data.get('carbohydrates', 0)
            meal.fats = new_meal_data.get('fats', 0)
            meal.fibre = new_meal_data.get('fibre', 0)
            meal.sugar = new_meal_data.get('sugar', 0)
            meal.sodium = new_meal_data.get('sodium', 0)
            meal.save()

            messages.success(request, f'{meal.meal_type.title()} regenerated successfully!')
            return redirect('meals:meal_plan_detail', pk=meal.meal_plan.pk)

        except Exception as e:
            messages.error(request, f'Error regenerating meal: {str(e)}')
            return redirect('meals:meal_plan_detail', pk=meal.meal_plan.pk)

    return render(request, 'meals/regenerate_confirm.html', {'meal': meal})

@login_required
def toggle_save_plan(request, pk):
    meal_plan = get_object_or_404(MealPlan, pk=pk, user_profile=request.user.profile)
    if request.method == 'POST':
        if meal_plan.is_saved:
            # Unsave
            meal_plan.is_saved = False
            meal_plan.save()
            messages.success(request, 'Meal plan unsaved.')
            return redirect('meals:meal_plan_detail', pk=pk)
        else:
            # Show naming prompt before saving
            return render(request, 'meals/save_plan.html', {'meal_plan': meal_plan})
    return redirect('meals:meal_plan_detail', pk=pk)


@login_required
def confirm_save_plan(request, pk):
    meal_plan = get_object_or_404(MealPlan, pk=pk, user_profile=request.user.profile)
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        meal_plan.title = title if title else f"Plan — {meal_plan.week_start_date.strftime('%d %b %Y')}"
        meal_plan.is_saved = True
        meal_plan.save()
        messages.success(request, f'Meal plan saved as "{meal_plan.title}"!')
        return redirect('meals:dashboard')
    return redirect('meals:meal_plan_detail', pk=pk)

@login_required
def rate_meal(request, pk):
    meal = get_object_or_404(Meal, pk=pk, meal_plan__user_profile=request.user.profile)
    if request.method == 'POST':
        rating = request.POST.get('rating')
        if rating and rating.isdigit() and 1 <= int(rating) <= 5:
            meal.rating = int(rating)
            meal.save()
            messages.success(request, f'Rated {meal.title} {rating} stars!')
        else:
            messages.error(request, 'Invalid rating. Please select 1-5 stars.')
    return redirect('meals:meal_detail', pk=pk)

@login_required
def meal_plan_history(request):
    profile = request.user.profile
    all_plans = MealPlan.objects.filter(
        user_profile=profile
    ).order_by('-created_at')

    context = {
        'all_plans': all_plans,
    }
    return render(request, 'meals/meal_plan_history.html', context)