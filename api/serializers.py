from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import UserProfile
from meals.models import MealPlan, Meal, ShoppingList, ShoppingListItem

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    subscription_tier = serializers.CharField(read_only=True)
    bmi = serializers.FloatField(read_only=True)
    bmi_category = serializers.CharField(read_only=True)
    daily_calorie_target = serializers.IntegerField(read_only=True)
    daily_water_intake = serializers.FloatField(read_only=True)
    age = serializers.IntegerField(read_only=True)  # computed from date_of_birth
    generation_status = serializers.SerializerMethodField()
    can_save = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'user', 'date_of_birth', 'age', 'region', 'dietary_preference', 'allergies',
            'other_allergy', 'health_conditions', 'other_health_condition',
            'budget', 'fitness_goal', 'height', 'weight', 'bmi', 'bmi_category',
            'daily_calorie_target', 'daily_water_intake', 'subscription_tier',
            'onboarding_complete', 'plan_generations_count',
            'generation_status', 'can_save',
        ]

    def get_generation_status(self, obj):
        return obj.get_generation_status()

    def get_can_save(self, obj):
        can, reason = obj.can_save_plan()
        return {'allowed': can, 'reason': reason}


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'date_of_birth', 'region', 'dietary_preference', 'allergies', 'other_allergy',
            'health_conditions', 'other_health_condition', 'budget', 'fitness_goal',
            'height', 'weight',
        ]

    def validate_date_of_birth(self, value):
        if value:
            from datetime import date
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            if age < 10:
                raise serializers.ValidationError('You must be at least 10 years old.')
            if age > 100:
                raise serializers.ValidationError('Please enter a valid date of birth.')
        return value


class OnboardingStep1Serializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['date_of_birth', 'height', 'weight']

    def validate_date_of_birth(self, value):
        if value:
            from datetime import date
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            if age < 10:
                raise serializers.ValidationError('You must be at least 10 years old.')
            if age > 100:
                raise serializers.ValidationError('Please enter a valid date of birth.')
        return value

    def validate_height(self, value):
        if value and (value < 50 or value > 300):
            raise serializers.ValidationError('Please enter a valid height in cm.')
        return value

    def validate_weight(self, value):
        if value and (value < 20 or value > 500):
            raise serializers.ValidationError('Please enter a valid weight in kg.')
        return value


class OnboardingStep2Serializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['dietary_preference', 'allergies', 'other_allergy', 'health_conditions', 'other_health_condition']


class OnboardingStep3Serializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['region', 'fitness_goal', 'budget']

    def validate_budget(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('Budget must be greater than 0.')
        return value


class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = [
            'id', 'day', 'meal_type', 'title', 'description', 'ingredients',
            'instructions', 'prep_time', 'difficulty', 'calories', 'protein',
            'carbohydrates', 'fats', 'fibre', 'sugar', 'sodium',
            'rating', 'portion_guide', 'suggested_time',
        ]


class ShoppingListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingListItem
        fields = ['id', 'ingredient_name', 'quantity', 'unit', 'category']


class ShoppingListSerializer(serializers.ModelSerializer):
    items = ShoppingListItemSerializer(many=True, read_only=True)

    class Meta:
        model = ShoppingList
        fields = ['id', 'items', 'generated_at']


class MealPlanSerializer(serializers.ModelSerializer):
    meals = MealSerializer(many=True, read_only=True)
    shopping_list = ShoppingListSerializer(read_only=True)
    nutrition_totals = serializers.SerializerMethodField()

    class Meta:
        model = MealPlan
        fields = [
            'id', 'week_start_date', 'created_at', 'is_saved', 'title',
            'is_partial', 'meals', 'shopping_list', 'nutrition_totals',
        ]

    def get_nutrition_totals(self, obj):
        meals = obj.meals.all()
        return {
            'calories': sum(m.calories for m in meals),
            'protein': round(sum(m.protein for m in meals), 1),
            'carbohydrates': round(sum(m.carbohydrates for m in meals), 1),
            'fats': round(sum(m.fats for m in meals), 1),
            'fibre': round(sum(m.fibre for m in meals), 1),
        }


class MealPlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — no meals included."""
    meal_count = serializers.SerializerMethodField()

    class Meta:
        model = MealPlan
        fields = ['id', 'week_start_date', 'created_at', 'is_saved', 'title', 'is_partial', 'meal_count']

    def get_meal_count(self, obj):
        return obj.meals.count()


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data


class VerifyOTPSerializer(serializers.Serializer):
    otp = serializers.CharField(min_length=6, max_length=6)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        return data


class RateMealSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)


class SavePlanSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=100, required=False, allow_blank=True)