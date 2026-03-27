from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from meals.models import MealPlan, Meal
from users.models import UserProfile


class GeneratePlanAPITests(TestCase):
    """
    Tests for POST /api/plans/generate/

    Checks the freemium generation gate without making real Groq calls.
    A blocked user (count >= 10) gets 403. Unauthenticated gets 401.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='genuser',
            email='gen@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.profile.height = 175
        self.profile.weight = 70
        self.profile.fitness_goal = 'maintain'
        self.profile.budget = 50
        self.profile.region = 'greater_accra'
        # Start an active window so count-based checks work
        self.profile.generation_reset_date = timezone.now().date()
        self.profile.save()
        self.client.force_authenticate(user=self.user)

    def test_blocked_user_gets_403(self):
        """
        A free user at count=10 should receive 403 Forbidden
        before any Groq call is made.
        """
        self.profile.plan_generations_count = 10
        self.profile.save()
        response = self.client.post('/api/plans/generate/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(response.data.get('upgrade_required'))

    def test_unauthenticated_cannot_generate(self):
        """Unauthenticated requests should be rejected with 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/plans/generate/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MealPlanDetailAPITests(TestCase):
    """
    Tests for GET /api/plans/<pk>/

    Checks show_lock and locked_days flags based on is_partial
    and subscription tier.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='detailuser',
            email='detail@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.client.force_authenticate(user=self.user)

    def test_partial_plan_shows_lock_for_free_user(self):
        """A partial plan viewed by a free user should have show_lock=True."""
        plan = MealPlan.objects.create(
            user_profile=self.profile,
            week_start_date=timezone.now().date(),
            is_partial=True,
        )
        response = self.client.get(f'/api/plans/{plan.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['show_lock'])

    def test_partial_plan_no_lock_for_premium_user(self):
        """A partial plan viewed by a premium user should have show_lock=False."""
        self.profile.subscription_tier = 'premium'
        self.profile.save()
        plan = MealPlan.objects.create(
            user_profile=self.profile,
            week_start_date=timezone.now().date(),
            is_partial=True,
        )
        response = self.client.get(f'/api/plans/{plan.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['show_lock'])

    def test_full_plan_never_shows_lock(self):
        """A full (non-partial) plan should never show the lock."""
        plan = MealPlan.objects.create(
            user_profile=self.profile,
            week_start_date=timezone.now().date(),
            is_partial=False,
        )
        response = self.client.get(f'/api/plans/{plan.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['show_lock'])

    def test_cannot_access_another_users_plan(self):
        """A user should get 404 if they try to access someone else's plan."""
        other_user = User.objects.create_user(
            username='otheruser', email='other@example.com', password='pass123'
        )
        other_plan = MealPlan.objects.create(
            user_profile=other_user.profile,
            week_start_date=timezone.now().date(),
        )
        response = self.client.get(f'/api/plans/{other_plan.pk}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SavePlanAPITests(TestCase):
    """
    Tests for POST /api/plans/<pk>/save/

    Free users can save up to 7 plans. The 8th save attempt returns 403.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='saveapiuser',
            email='saveapi@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.client.force_authenticate(user=self.user)

    def test_free_user_can_save_first_plan(self):
        """Saving the first plan should succeed for a free user."""
        plan = MealPlan.objects.create(
            user_profile=self.profile,
            week_start_date=timezone.now().date(),
        )
        response = self.client.post(
            f'/api/plans/{plan.pk}/save/',
            {'title': 'My First Plan'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plan.refresh_from_db()
        self.assertTrue(plan.is_saved)
        self.assertEqual(plan.title, 'My First Plan')

    def test_free_user_blocked_on_eighth_save(self):
        """A free user who already has 7 saved plans should get 403."""
        for _ in range(7):
            MealPlan.objects.create(
                user_profile=self.profile,
                week_start_date=timezone.now().date(),
                is_saved=True,
            )
        new_plan = MealPlan.objects.create(
            user_profile=self.profile,
            week_start_date=timezone.now().date(),
        )
        response = self.client.post(
            f'/api/plans/{new_plan.pk}/save/',
            {'title': 'Plan 8'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(response.data.get('upgrade_required'))

    def test_save_auto_generates_title_when_empty(self):
        """If no title is provided, a title should be auto-generated."""
        plan = MealPlan.objects.create(
            user_profile=self.profile,
            week_start_date=timezone.now().date(),
        )
        response = self.client.post(
            f'/api/plans/{plan.pk}/save/',
            {'title': ''},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plan.refresh_from_db()
        self.assertTrue(plan.is_saved)
        self.assertIn('Plan', plan.title)


class RateMealAPITests(TestCase):
    """Tests for POST /api/meals/<pk>/rate/"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='rateuser',
            email='rate@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.client.force_authenticate(user=self.user)
        plan = MealPlan.objects.create(
            user_profile=self.profile,
            week_start_date=timezone.now().date(),
        )
        self.meal = Meal.objects.create(
            meal_plan=plan,
            day='monday',
            meal_type='breakfast',
            title='Test Meal',
            description='A test meal',
            ingredients=['eggs', 'bread'],
            instructions='Cook it.',
        )

    def test_valid_rating_saved(self):
        """Rating 1–5 should be accepted and saved."""
        response = self.client.post(
            f'/api/meals/{self.meal.pk}/rate/',
            {'rating': 4},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.meal.refresh_from_db()
        self.assertEqual(self.meal.rating, 4)

    def test_rating_above_5_rejected(self):
        """Rating above 5 should be rejected."""
        response = self.client.post(
            f'/api/meals/{self.meal.pk}/rate/',
            {'rating': 6},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rating_below_1_rejected(self):
        """Rating below 1 should be rejected."""
        response = self.client.post(
            f'/api/meals/{self.meal.pk}/rate/',
            {'rating': 0},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_rate_another_users_meal(self):
        """A user should not be able to rate meals from another user's plan."""
        other_user = User.objects.create_user(
            username='other2', email='other2@example.com', password='pass123'
        )
        other_plan = MealPlan.objects.create(
            user_profile=other_user.profile,
            week_start_date=timezone.now().date(),
        )
        other_meal = Meal.objects.create(
            meal_plan=other_plan,
            day='tuesday',
            meal_type='lunch',
            title='Other Meal',
            description='Not mine',
            ingredients=['rice'],
            instructions='Cook rice.',
        )
        response = self.client.post(
            f'/api/meals/{other_meal.pk}/rate/',
            {'rating': 5},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)