from django.db import models
from users.models import UserProfile


class MealPlan(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='meal_plans')
    week_start_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_saved = models.BooleanField(default=False)
    title = models.CharField(max_length=100, blank=True, default='')
    is_partial = models.BooleanField(default=False, help_text="True if this is a 3-day half plan for free tier")

    def __str__(self):
        return f"{self.user_profile.user.username} - Week of {self.week_start_date}"


class Meal(models.Model):
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]

    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='meals')
    day = models.CharField(max_length=20, choices=DAY_CHOICES)
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    ingredients = models.JSONField(default=list)
    instructions = models.TextField()
    prep_time = models.IntegerField(help_text="Prep time in minutes", default=0)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='easy')
    calories = models.IntegerField(default=0)
    protein = models.FloatField(default=0, help_text="Grams")
    carbohydrates = models.FloatField(default=0, help_text="Grams")
    fats = models.FloatField(default=0, help_text="Grams")
    fibre = models.FloatField(default=0, help_text="Grams")
    sugar = models.FloatField(default=0, help_text="Grams")
    sodium = models.FloatField(default=0, help_text="Milligrams")
    rating = models.IntegerField(null=True, blank=True)
    portion_guide = models.TextField(blank=True, default='')
    suggested_time = models.CharField(max_length=50, blank=True, default='')

    def __str__(self):
        return f"{self.day} {self.meal_type} - {self.title}"


class ShoppingList(models.Model):
    meal_plan = models.OneToOneField(MealPlan, on_delete=models.CASCADE, related_name='shopping_list')
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Shopping List for {self.meal_plan}"


class ShoppingListItem(models.Model):
    CATEGORY_CHOICES = [
        ('proteins', 'Proteins'),
        ('vegetables', 'Vegetables'),
        ('fruits', 'Fruits'),
        ('grains', 'Grains'),
        ('dairy', 'Dairy'),
        ('pantry', 'Pantry'),
    ]

    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name='items')
    ingredient_name = models.CharField(max_length=200)
    quantity = models.CharField(max_length=100)
    unit = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='pantry')

    def __str__(self):
        return f"{self.ingredient_name} - {self.category}"