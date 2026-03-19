from django.db import models
from users.models import UserProfile
from django.contrib.auth.models import User


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
    
class Notification(models.Model):
    TYPE_CHOICES = [
        ('plan_generated', 'Plan Generated'),
        ('plan_saved', 'Plan Saved'),
        ('upgrade', 'Upgraded to Premium'),
        ('cancelled', 'Subscription Cancelled'),
        ('payment_failed', 'Payment Failed'),
        ('save_limit', 'Save Limit Reached'),
        ('weekly_summary', 'Weekly Summary'),
        ('general', 'General'),
    ]

    ICON_MAP = {
        'plan_generated': '🍽️',
        'plan_saved': '📌',
        'upgrade': '✨',
        'cancelled': '💔',
        'payment_failed': '⚠️',
        'save_limit': '🔒',
        'weekly_summary': '📊',
        'general': '🔔',
    }

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    title = models.CharField(max_length=120)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def icon(self):
        return self.ICON_MAP.get(self.type, '🔔')

    def __str__(self):
        return f'{self.user.username} — {self.title}'

# ── Progress & Streak Models ──────────────────────────────────────────────────

class DailyCheckin(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='checkins')
    date = models.DateField()
    completed_items = models.JSONField(default=list)
    items_completed = models.IntegerField(default=0)
    is_consistent = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f'{self.user.username} — {self.date}'


class StreakRecord(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='streak')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    freeze_tokens = models.IntegerField(default=1)
    total_active_days = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.user.username} — streak {self.current_streak}'


class Achievement(models.Model):
    slug = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=200)
    icon = models.CharField(max_length=10, default='🏆')

    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')
        ordering = ['-unlocked_at']

    def __str__(self):
        return f'{self.user.username} — {self.achievement.name}'