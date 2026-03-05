from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import UserProfile


class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=50, required=True)
    last_name = forms.CharField(max_length=50, required=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'password1', 'password2']


class OnboardingStep1Form(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['height', 'weight']
        widgets = {
            'height': forms.NumberInput(attrs={'placeholder': 'e.g. 175'}),
            'weight': forms.NumberInput(attrs={'placeholder': 'e.g. 70'}),
        }
        labels = {
            'height': 'Height (cm)',
            'weight': 'Weight (kg)',
        }


class OnboardingStep2Form(forms.ModelForm):
    ALLERGY_CHOICES = [
        ('nuts', 'Nuts'),
        ('gluten', 'Gluten'),
        ('dairy', 'Dairy'),
        ('shellfish', 'Shellfish'),
        ('eggs', 'Eggs'),
        ('soy', 'Soy'),
    ]

    allergies = forms.MultipleChoiceField(
        choices=ALLERGY_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

    class Meta:
        model = UserProfile
        fields = ['dietary_preference', 'allergies']


class OnboardingStep3Form(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['fitness_goal', 'budget']
        widgets = {
            'budget': forms.NumberInput(attrs={'placeholder': 'e.g. 50'}),
        }
        labels = {
            'budget': 'Weekly Food Budget (₵)',
        }


class ProfileUpdateForm(forms.ModelForm):
    ALLERGY_CHOICES = [
        ('nuts', 'Nuts'),
        ('gluten', 'Gluten'),
        ('dairy', 'Dairy'),
        ('shellfish', 'Shellfish'),
        ('eggs', 'Eggs'),
        ('soy', 'Soy'),
    ]

    allergies = forms.MultipleChoiceField(
        choices=ALLERGY_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

    class Meta:
        model = UserProfile
        fields = [
            'height', 'weight', 'dietary_preference',
            'allergies', 'fitness_goal', 'budget'
        ]