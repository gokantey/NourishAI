from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import date


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

    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    ACTIVITY_CHOICES = [
        ('sedentary', 'Sedentary'),
        ('lightly_active', 'Lightly Active'),
        ('moderately_active', 'Moderately Active'),
        ('very_active', 'Very Active'),
    ]

    ALLERGY_CHOICES = [
        ('nuts', 'Nuts'),
        ('gluten', 'Gluten'),
        ('dairy', 'Dairy'),
        ('shellfish', 'Shellfish'),
        ('eggs', 'Eggs'),
        ('soy', 'Soy'),
    ]

    REGION_CHOICES = [
        ('greater_accra', 'Greater Accra'),
        ('ashanti', 'Ashanti'),
        ('western', 'Western'),
        ('central', 'Central'),
        ('eastern', 'Eastern'),
        ('volta', 'Volta'),
        ('oti', 'Oti'),
        ('northern', 'Northern'),
        ('savannah', 'Savannah'),
        ('north_east', 'North East'),
        ('upper_east', 'Upper East'),
        ('upper_west', 'Upper West'),
        ('bono', 'Bono'),
        ('bono_east', 'Bono East'),
        ('ahafo', 'Ahafo'),
        ('western_north', 'Western North'),
    ]

    HEALTH_CONDITION_CHOICES = [
        ('type1_diabetes', 'Type 1 Diabetes'),
        ('type2_diabetes', 'Type 2 Diabetes'),
        ('hypertension', 'Hypertension (High Blood Pressure)'),
        ('high_cholesterol', 'High Cholesterol'),
        ('hypothyroidism', 'Hypothyroidism (Underactive Thyroid)'),
        ('hyperthyroidism', 'Hyperthyroidism (Overactive Thyroid)'),
        ('fatty_liver', 'Fatty Liver'),
        ('gout', 'Gout'),
        ('anaemia', 'Anaemia'),
        ('sickle_cell', 'Sickle Cell Disease'),
        ('hiv_aids', 'HIV/AIDS'),
        ('celiac_disease', 'Celiac Disease'),
        ('lactose_intolerance', 'Lactose Intolerance'),
        ('gastritis', 'Gastritis / Acid Reflux'),
        ('ibs', 'Irritable Bowel Syndrome (IBS)'),
        ('kidney_disease', 'Kidney Disease'),
        ('pcos', 'PCOS'),
        ('asthma', 'Asthma'),
        ('heart_disease', 'Heart Disease'),
        ('stroke_history', 'Stroke History'),
        ('cancer', 'Cancer (General)'),
        ('osteoporosis', 'Osteoporosis'),
        ('arthritis', 'Arthritis'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    # date_of_birth replaces age — age is now always computed from DOB
    date_of_birth = models.DateField(null=True, blank=True, help_text="User's date of birth (DD/MM/YYYY)")
    sex = models.CharField(max_length=20, choices=SEX_CHOICES, null=True, blank=True)
    activity_level = models.CharField(max_length=30, choices=ACTIVITY_CHOICES, default='lightly_active', null=True, blank=True)
    region = models.CharField(max_length=50, choices=REGION_CHOICES, null=True, blank=True)
    dietary_preference = models.CharField(max_length=50, choices=DIETARY_CHOICES, default='none')
    allergies = models.JSONField(default=list, blank=True)
    other_allergy = models.TextField(blank=True, default='', help_text="Any allergy not listed above")
    health_conditions = models.JSONField(default=list, blank=True)
    other_health_condition = models.TextField(blank=True, default='', help_text="Any health condition not listed above")
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
    plan_generations_count = models.IntegerField(default=0)
    generation_reset_date = models.DateField(null=True, blank=True)

    # Daily checklist customisation — stores list of active item keys
    # Defaults to all 6 items enabled
    checklist_items = models.JSONField(
        default=list,
        blank=True,
        help_text="List of active daily checklist item keys chosen by the user"
    )

    @property
    def age(self):
        """Computed age from date_of_birth. Returns None if DOB not set."""
        if not self.date_of_birth:
            return None
        today = date.today()
        dob = self.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @property
    def is_birthday_today(self):
        """Returns True if today is the user's birthday."""
        if not self.date_of_birth:
            return False
        today = date.today()
        return self.date_of_birth.month == today.month and self.date_of_birth.day == today.day

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
        """Calculate TDEE using Mifflin-St Jeor BMR if enough data is available.
        Falls back to flat values for existing users without sex/age."""
        ACTIVITY_MULTIPLIERS = {
            'sedentary': 1.2,
            'lightly_active': 1.375,
            'moderately_active': 1.55,
            'very_active': 1.725,
        }

        if self.height and self.weight and self.sex in ('male', 'female') and self.age:
            # Mifflin-St Jeor BMR
            if self.sex == 'male':
                bmr = (10 * self.weight) + (6.25 * self.height) - (5 * self.age) + 5
            else:
                bmr = (10 * self.weight) + (6.25 * self.height) - (5 * self.age) - 161

            multiplier = ACTIVITY_MULTIPLIERS.get(self.activity_level or 'lightly_active', 1.375)
            tdee = round(bmr * multiplier)

            if self.fitness_goal == 'lose_weight':
                self.daily_calorie_target = max(1200, tdee - 500)
            elif self.fitness_goal == 'build_muscle':
                self.daily_calorie_target = tdee + 300
            else:
                self.daily_calorie_target = tdee
        else:
            # Fallback for existing users without sex/age
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
                return {'message': 'You are already underweight. Losing more weight is not recommended.', 'weeks': None, 'target_weight': None, 'safe': False}
            target_weight = round(24.9 * (height_m ** 2), 1)
            kg_to_lose = round(self.weight - target_weight, 1)
            if kg_to_lose <= 0:
                return {'message': 'You are already at a healthy weight.', 'weeks': None, 'target_weight': target_weight, 'safe': True}
            weeks = round(kg_to_lose / 0.5)
            months = round(weeks / 4.3, 1)
            return {'message': f'At a safe rate of 0.5kg/week, you can reach a healthy weight in approximately {weeks} weeks ({months} months).', 'weeks': weeks, 'months': months, 'kg_to_lose': kg_to_lose, 'target_weight': target_weight, 'safe': True}

        elif self.fitness_goal == 'build_muscle':
            if self.bmi >= 25.0:
                return {'message': 'Focus on body recomposition — build muscle while losing fat before bulking.', 'weeks': None, 'target_weight': None, 'safe': True}
            target_weight = round(22.0 * (height_m ** 2), 1)
            kg_to_gain = round(target_weight - self.weight, 1)
            if kg_to_gain <= 0:
                return {'message': 'You are already at a good weight for muscle building. Focus on strength training.', 'weeks': None, 'target_weight': target_weight, 'safe': True}
            weeks = round(kg_to_gain / 0.25)
            months = round(weeks / 4.3, 1)
            return {'message': f'At a safe rate of 0.25kg/week, you can reach your target weight in approximately {weeks} weeks ({months} months).', 'weeks': weeks, 'months': months, 'kg_to_gain': kg_to_gain, 'target_weight': target_weight, 'safe': True}

        elif self.fitness_goal == 'maintain':
            if self.bmi_category == 'Normal':
                return {'message': 'You are at a healthy weight. Keep maintaining your current lifestyle.', 'weeks': None, 'safe': True}
            elif self.bmi_category in ['Overweight', 'Obese']:
                return {'message': 'Your BMI suggests you are above the healthy range. Consider switching your goal to lose weight.', 'weeks': None, 'safe': False}
            else:
                return {'message': 'Your BMI suggests you are underweight. Consider switching your goal to build muscle.', 'weeks': None, 'safe': False}

        return None

    def get_generation_status(self):
        """
        Returns generation status for the current 30-day window.
        Free tier:
          Generations 1-7  -> full 7-day plan
          Generations 8-10 -> partial 3-day plan (days 4-7 blurred)
          Generation  11+  -> blocked until reset

        The 30-day window starts on the day the user generates their first plan.
        reset_date = generation_reset_date + 30 days.
        When today >= reset_date, the count resets and a new 30-day window begins.
        Premium / staff / superuser -> always full, never blocked.
        """
        from datetime import timedelta

        is_premium = (
            self.subscription_tier == 'premium'
            or self.user.is_staff
            or self.user.is_superuser
        )
        if is_premium:
            return {'type': 'full', 'allowed': True, 'reset_date': None}

        today = timezone.now().date()

        # If a window is active, check if 30 days have passed since it started
        if self.generation_reset_date is not None:
            window_reset = self.generation_reset_date + timedelta(days=30)
            if today >= window_reset:
                # 30-day window expired — reset the count
                self.plan_generations_count = 0
                self.generation_reset_date = None
                self.save(update_fields=['plan_generations_count', 'generation_reset_date'])

        count = self.plan_generations_count

        # No generations yet in this window — window hasn't started
        if self.generation_reset_date is None:
            return {'type': 'full', 'allowed': True, 'reset_date': None}

        # Window is active — compute reset date to show user
        reset_date = (self.generation_reset_date + timedelta(days=30)).isoformat()

        if count < 7:
            return {'type': 'full', 'allowed': True, 'reset_date': reset_date}
        elif count < 10:
            return {'type': 'partial', 'allowed': True, 'reset_date': reset_date}
        else:
            return {'type': 'blocked', 'allowed': False, 'reset_date': reset_date}

    def can_save_plan(self):
        """
        Free users can save up to 7 plans.
        Premium users and staff have unlimited saves.
        """
        if self.user.is_staff or self.user.is_superuser:
            return True, None
        if self.subscription_tier == 'premium':
            return True, None
        saved_count = self.meal_plans.filter(is_saved=True).count()
        if saved_count >= 7:
            return False, "You've saved your 7 free plans. Upgrade to Premium for unlimited saves."
        return True, None

    def increment_generation_count(self):
        """
        Called after every successful generation.
        Sets generation_reset_date on the first generation of a new window.
        The window then runs for 30 days from this date.
        """
        if self.generation_reset_date is None:
            # First generation — start the 30-day window from today
            self.generation_reset_date = timezone.now().date()
        self.plan_generations_count += 1
        self.save(update_fields=['plan_generations_count', 'generation_reset_date'])

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