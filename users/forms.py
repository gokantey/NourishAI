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
        fields = ['age', 'height', 'weight']
        widgets = {
            'age': forms.NumberInput(attrs={'placeholder': 'e.g. 25', 'min': 10, 'max': 100}),
            'height': forms.NumberInput(attrs={'placeholder': 'e.g. 175'}),
            'weight': forms.NumberInput(attrs={'placeholder': 'e.g. 70'}),
        }
        labels = {
            'age': 'Age (years)',
            'height': 'Height (cm)',
            'weight': 'Weight (kg)',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # All three fields are required on step 1
        self.fields['age'].required = True
        self.fields['height'].required = True
        self.fields['weight'].required = True

    def clean_age(self):
        age = self.cleaned_data.get('age')
        if not age:
            raise forms.ValidationError('Please enter your age.')
        if age < 10 or age > 100:
            raise forms.ValidationError('Please enter a valid age between 10 and 100.')
        return age

    def clean_height(self):
        height = self.cleaned_data.get('height')
        if not height:
            raise forms.ValidationError('Please enter your height.')
        if height < 50 or height > 300:
            raise forms.ValidationError('Please enter a valid height in cm (e.g. 175).')
        return height

    def clean_weight(self):
        weight = self.cleaned_data.get('weight')
        if not weight:
            raise forms.ValidationError('Please enter your weight.')
        if weight < 10 or weight > 500:
            raise forms.ValidationError('Please enter a valid weight in kg (e.g. 70).')
        return weight


ALLERGY_CHOICES = [
    ('nuts', 'Nuts'),
    ('gluten', 'Gluten'),
    ('dairy', 'Dairy'),
    ('shellfish', 'Shellfish'),
    ('eggs', 'Eggs'),
    ('soy', 'Soy'),
]

HEALTH_CONDITION_FLAT_CHOICES = [
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


class OnboardingStep2Form(forms.ModelForm):
    # Step 2 — everything optional, no restrictions
    allergies = forms.MultipleChoiceField(
        choices=ALLERGY_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

    other_allergy = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'placeholder': "e.g. Mango, Avocado, Sesame, Peanuts...",
            'rows': 2,
        }),
        label='Other allergy not listed above'
    )

    health_conditions = forms.MultipleChoiceField(
        choices=HEALTH_CONDITION_FLAT_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

    other_health_condition = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'placeholder': "e.g. Lupus, Crohn's disease, Epilepsy...",
            'rows': 2,
        }),
        label='Other condition not listed above'
    )

    class Meta:
        model = UserProfile
        fields = ['dietary_preference', 'allergies', 'other_allergy', 'health_conditions', 'other_health_condition']


class OnboardingStep3Form(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['region', 'fitness_goal', 'budget']
        widgets = {
            'budget': forms.NumberInput(attrs={'placeholder': 'e.g. 50', 'min': 1}),
            'region': forms.Select(),
        }
        labels = {
            'region': 'Region in Ghana',
            'budget': 'Weekly Food Budget (₵)',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Region is optional, fitness_goal and budget are required
        self.fields['region'].required = False
        self.fields['fitness_goal'].required = True
        self.fields['budget'].required = True

    def clean_budget(self):
        budget = self.cleaned_data.get('budget')
        if budget is None:
            raise forms.ValidationError('Please enter your weekly food budget.')
        if budget <= 0:
            raise forms.ValidationError('Budget must be greater than zero.')
        return budget

    def clean_fitness_goal(self):
        goal = self.cleaned_data.get('fitness_goal')
        if not goal:
            raise forms.ValidationError('Please select a fitness goal.')
        return goal


class ProfileUpdateForm(forms.ModelForm):
    allergies = forms.MultipleChoiceField(
        choices=ALLERGY_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

    other_allergy = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'placeholder': "e.g. Mango, Avocado, Sesame, Peanuts...",
            'rows': 2,
        }),
        label='Other allergy not listed above'
    )

    health_conditions = forms.MultipleChoiceField(
        choices=HEALTH_CONDITION_FLAT_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

    other_health_condition = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'placeholder': "e.g. Lupus, Crohn's disease, Epilepsy...",
            'rows': 2,
        }),
        label='Other condition not listed above'
    )

    class Meta:
        model = UserProfile
        fields = [
            'age', 'region', 'height', 'weight',
            'dietary_preference', 'allergies', 'other_allergy',
            'health_conditions', 'other_health_condition',
            'fitness_goal', 'budget'
        ]
        widgets = {
            'age': forms.NumberInput(attrs={'placeholder': 'e.g. 25', 'min': 10, 'max': 100}),
            'region': forms.Select(),
        }
        labels = {
            'age': 'Age (years)',
            'region': 'Region in Ghana',
        }