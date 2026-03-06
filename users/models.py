from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class UserProfile(models.Model):
    DIETARY_CHOICES = [
        ('none', 'No Restriction'),
        ('vegan', 'Vegan'),
        ('vegetarian', 'Vegetarian'),
        ('keto', 'Keto'),
        ('halal', 'Halal'),
        ('gluten_free', 'Gluten Free'),
        ('paleo', 'Paleo'),
    ]

    FITNESS_CHOICES = [
        ('lose_weight', 'Lose Weight'),
        ('maintain', 'Maintain Weight'),
        ('build_muscle', 'Build Muscle'),
    ]

    SUBSCRIPTION_CHOICES = [
        ('free', 'Free'),
        ('premium', 'Premium'),
    ]

    ALLERGY_CHOICES = [
        ('nuts', 'Nuts'),
        ('gluten', 'Gluten'),
        ('dairy', 'Dairy'),
        ('shellfish', 'Shellfish'),
        ('eggs', 'Eggs'),
        ('soy', 'Soy'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    dietary_preference = models.CharField(max_length=50, choices=DIETARY_CHOICES, default='none')
    allergies = models.JSONField(default=list, blank=True)
    budget = models.DecimalField(max_digits=6, decimal_places=2, default=50.00)
    fitness_goal = models.CharField(max_length=50, choices=FITNESS_CHOICES, default='maintain')
    height = models.FloatField(help_text="Height in cm", null=True, blank=True)
    weight = models.FloatField(help_text="Weight in kg", null=True, blank=True)
    bmi = models.FloatField(null=True, blank=True)
    bmi_category = models.CharField(max_length=20, null=True, blank=True)
    daily_calorie_target = models.IntegerField(null=True, blank=True)
    daily_water_intake = models.FloatField(null=True, blank=True, help_text="Litres per day")
    subscription_tier = models.CharField(max_length=20, choices=SUBSCRIPTION_CHOICES, default='free')
    onboarding_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paystack_customer_id = models.CharField(max_length=100, blank=True, null=True)
    paystack_subscription_code = models.CharField(max_length=100, blank=True, null=True)
    plan_generations_this_month = models.IntegerField(default=0)
    last_generation_reset = models.DateField(null=True, blank=True)

    def calculate_bmi(self):
        if self.height and self.weight:
            height_m = self.height / 100
            self.bmi = round(self.weight / (height_m ** 2), 1)
            if self.bmi < 18.5:
                self.bmi_category = 'Underweight'
            elif self.bmi < 25.0:
                self.bmi_category = 'Normal'
            elif self.bmi < 30.0:
                self.bmi_category = 'Overweight'
            else:
                self.bmi_category = 'Obese'

    def calculate_daily_targets(self):
        if self.bmi and self.fitness_goal:
            if self.fitness_goal == 'lose_weight':
                self.daily_calorie_target = 1800
            elif self.fitness_goal == 'build_muscle':
                self.daily_calorie_target = 3000
            else:
                self.daily_calorie_target = 2200

        if self.weight:
            self.daily_water_intake = round(self.weight * 0.033, 1)

    def calculate_goal_estimate(self):
        if not self.bmi or not self.weight or not self.height:
            return None

        height_m = self.height / 100

        if self.fitness_goal == 'lose_weight':
            if self.bmi <= 18.5:
                return {
                    'message': 'You are already underweight. Losing more weight is not recommended.',
                    'weeks': None,
                    'target_weight': None,
                    'safe': False,
                }
            target_weight = round(24.9 * (height_m ** 2), 1)
            kg_to_lose = round(self.weight - target_weight, 1)
            if kg_to_lose <= 0:
                return {
                    'message': 'You are already at a healthy weight.',
                    'weeks': None,
                    'target_weight': target_weight,
                    'safe': True,
                }
            weeks = round(kg_to_lose / 0.5)
            months = round(weeks / 4.3, 1)
            return {
                'message': f'At a safe rate of 0.5kg/week, you can reach a healthy weight in approximately {weeks} weeks ({months} months).',
                'weeks': weeks,
                'months': months,
                'kg_to_lose': kg_to_lose,
                'target_weight': target_weight,
                'safe': True,
            }

        elif self.fitness_goal == 'build_muscle':
            if self.bmi >= 25.0:
                return {
                    'message': 'Focus on body recomposition — build muscle while losing fat before bulking.',
                    'weeks': None,
                    'target_weight': None,
                    'safe': True,
                }
            target_weight = round(22.0 * (height_m ** 2), 1)
            kg_to_gain = round(target_weight - self.weight, 1)
            if kg_to_gain <= 0:
                return {
                    'message': 'You are already at a good weight for muscle building. Focus on strength training.',
                    'weeks': None,
                    'target_weight': target_weight,
                    'safe': True,
                }
            weeks = round(kg_to_gain / 0.25)
            months = round(weeks / 4.3, 1)
            return {
                'message': f'At a safe rate of 0.25kg/week, you can reach your target weight in approximately {weeks} weeks ({months} months).',
                'weeks': weeks,
                'months': months,
                'kg_to_gain': kg_to_gain,
                'target_weight': target_weight,
                'safe': True,
            }

        elif self.fitness_goal == 'maintain':
            if self.bmi_category == 'Normal':
                return {
                    'message': 'You are at a healthy weight. Keep maintaining your current lifestyle.',
                    'weeks': None,
                    'safe': True,
                }
            elif self.bmi_category in ['Overweight', 'Obese']:
                return {
                    'message': 'Your BMI suggests you are above the healthy range. Consider switching your goal to lose weight.',
                    'weeks': None,
                    'safe': False,
                }
            else:
                return {
                    'message': 'Your BMI suggests you are underweight. Consider switching your goal to build muscle.',
                    'weeks': None,
                    'safe': False,
                }

        return None

    def can_generate_plan(self):
        today = timezone.now().date()

        if self.user.is_staff or self.user.is_superuser:
            return True, None

        if self.last_generation_reset is None or self.last_generation_reset.month != today.month:
            self.plan_generations_this_month = 0
            self.last_generation_reset = today
            self.save()

        if self.subscription_tier == 'premium':
            return True, None

        if self.plan_generations_this_month >= 3:
            return False, "You've used your 3 free plans this month. Upgrade to Premium for unlimited plans."

        return True, None

    def increment_generation_count(self):
        self.plan_generations_this_month += 1
        self.save()

    def save(self, *args, **kwargs):
        self.calculate_bmi()
        self.calculate_daily_targets()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username}'s Profile"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)