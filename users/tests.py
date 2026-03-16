from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from users.models import UserProfile
from meals.models import MealPlan


class GenerationStatusTests(TestCase):
    """
    Tests for UserProfile.get_generation_status().

    This is the most critical business logic in NourishAI —
    it controls what free users can and can't generate.
    New tiers: gens 1-7 = full, 8-10 = partial, 11+ = blocked.
    """

    def setUp(self):
        """Create a basic free user for each test."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        # Make sure we're in the current month so monthly reset doesn't interfere
        self.profile.generation_reset_date = timezone.now().date()
        self.profile.save()

    def test_first_generation_is_full(self):
        """A brand new user (count=0) should get a full 7-day plan."""
        self.profile.plan_generations_count = 0
        self.profile.save()
        status = self.profile.get_generation_status()
        self.assertEqual(status['type'], 'full')
        self.assertTrue(status['allowed'])

    def test_generation_7_is_still_full(self):
        """The 7th generation (count=6) should still be a full plan."""
        self.profile.plan_generations_count = 6
        self.profile.save()
        status = self.profile.get_generation_status()
        self.assertEqual(status['type'], 'full')
        self.assertTrue(status['allowed'])

    def test_generation_8_becomes_partial(self):
        """The 8th generation (count=7) should switch to partial."""
        self.profile.plan_generations_count = 7
        self.profile.save()
        status = self.profile.get_generation_status()
        self.assertEqual(status['type'], 'partial')
        self.assertTrue(status['allowed'])

    def test_generation_10_is_still_partial(self):
        """The 10th generation (count=9) should still be partial."""
        self.profile.plan_generations_count = 9
        self.profile.save()
        status = self.profile.get_generation_status()
        self.assertEqual(status['type'], 'partial')
        self.assertTrue(status['allowed'])

    def test_generation_11_is_blocked(self):
        """The 11th generation (count=10) should be blocked."""
        self.profile.plan_generations_count = 10
        self.profile.save()
        status = self.profile.get_generation_status()
        self.assertEqual(status['type'], 'blocked')
        self.assertFalse(status['allowed'])

    def test_generation_100_is_still_blocked(self):
        """Any count >= 10 should remain blocked."""
        self.profile.plan_generations_count = 100
        self.profile.save()
        status = self.profile.get_generation_status()
        self.assertEqual(status['type'], 'blocked')
        self.assertFalse(status['allowed'])

    def test_premium_user_always_gets_full(self):
        """Premium users are never blocked, always full."""
        self.profile.subscription_tier = 'premium'
        self.profile.plan_generations_count = 999
        self.profile.save()
        status = self.profile.get_generation_status()
        self.assertEqual(status['type'], 'full')
        self.assertTrue(status['allowed'])

    def test_staff_user_always_gets_full(self):
        """Staff users are never blocked, always full."""
        self.user.is_staff = True
        self.user.save()
        self.profile.plan_generations_count = 999
        self.profile.save()
        status = self.profile.get_generation_status()
        self.assertEqual(status['type'], 'full')
        self.assertTrue(status['allowed'])

    def test_monthly_reset_resets_count(self):
        """
        If generation_reset_date is from a previous month,
        the count should reset to 0 and the user gets a full plan.
        """
        self.profile.plan_generations_count = 10  # would normally be blocked
        self.profile.generation_reset_date = (
            timezone.now().date() - timedelta(days=35)  # last month
        )
        self.profile.save()
        status = self.profile.get_generation_status()
        # After reset, count is 0 — should be full
        self.assertEqual(status['type'], 'full')
        self.assertTrue(status['allowed'])
        # And the count should have been reset in the database
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.plan_generations_count, 0)


class SavePlanTests(TestCase):
    """
    Tests for UserProfile.can_save_plan().
    Free users can save 7 plans. Premium unlimited.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='saveuser',
            email='save@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile

    def test_free_user_can_save_first_plan(self):
        """A free user with 0 saved plans should be allowed to save."""
        can_save, reason = self.profile.can_save_plan()
        self.assertTrue(can_save)
        self.assertIsNone(reason)

    def test_free_user_can_save_up_to_7(self):
        """A free user with 6 saved plans should still be allowed to save."""
        for _ in range(6):
            MealPlan.objects.create(
                user_profile=self.profile,
                week_start_date=timezone.now().date(),
                is_saved=True,
            )
        can_save, reason = self.profile.can_save_plan()
        self.assertTrue(can_save)
        self.assertIsNone(reason)

    def test_free_user_blocked_after_seven_saves(self):
        """A free user who already has 7 saved plans should be blocked."""
        for _ in range(7):
            MealPlan.objects.create(
                user_profile=self.profile,
                week_start_date=timezone.now().date(),
                is_saved=True,
            )
        can_save, reason = self.profile.can_save_plan()
        self.assertFalse(can_save)
        self.assertIsNotNone(reason)
        self.assertIn('Upgrade', reason)

    def test_premium_user_can_always_save(self):
        """A premium user should always be allowed to save, even with many plans."""
        self.profile.subscription_tier = 'premium'
        self.profile.save()
        for _ in range(20):
            MealPlan.objects.create(
                user_profile=self.profile,
                week_start_date=timezone.now().date(),
                is_saved=True,
            )
        can_save, reason = self.profile.can_save_plan()
        self.assertTrue(can_save)
        self.assertIsNone(reason)

    def test_unsaved_plans_dont_count_toward_limit(self):
        """Unsaved plans should not count toward the free save limit."""
        for _ in range(7):
            MealPlan.objects.create(
                user_profile=self.profile,
                week_start_date=timezone.now().date(),
                is_saved=False,
            )
        can_save, reason = self.profile.can_save_plan()
        self.assertTrue(can_save)


class BMICalculationTests(TestCase):
    """
    Tests for UserProfile.calculate_bmi().
    Called automatically on every profile save().
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='bmiuser',
            email='bmi@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile

    def test_normal_bmi(self):
        """Height 175cm, weight 70kg → BMI ~22.9 → Normal."""
        self.profile.height = 175
        self.profile.weight = 70
        self.profile.save()
        self.assertAlmostEqual(self.profile.bmi, 22.9, delta=0.1)
        self.assertEqual(self.profile.bmi_category, 'Normal')

    def test_underweight_bmi(self):
        """BMI below 18.5 → Underweight."""
        self.profile.height = 180
        self.profile.weight = 50
        self.profile.save()
        self.assertLess(self.profile.bmi, 18.5)
        self.assertEqual(self.profile.bmi_category, 'Underweight')

    def test_overweight_bmi(self):
        """BMI 25–29.9 → Overweight."""
        self.profile.height = 170
        self.profile.weight = 85
        self.profile.save()
        self.assertGreaterEqual(self.profile.bmi, 25.0)
        self.assertLess(self.profile.bmi, 30.0)
        self.assertEqual(self.profile.bmi_category, 'Overweight')

    def test_obese_bmi(self):
        """BMI >= 30 → Obese."""
        self.profile.height = 170
        self.profile.weight = 110
        self.profile.save()
        self.assertGreaterEqual(self.profile.bmi, 30.0)
        self.assertEqual(self.profile.bmi_category, 'Obese')

    def test_no_bmi_without_height_and_weight(self):
        """BMI should be None if height or weight is missing."""
        self.profile.height = None
        self.profile.weight = None
        self.profile.save()
        self.assertIsNone(self.profile.bmi)


class CalorieTargetTests(TestCase):
    """
    Tests for UserProfile.calculate_daily_targets().
    Calorie targets are set based on fitness goal.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='caluser',
            email='cal@example.com',
            password='testpass123'
        )
        self.profile = self.user.profile
        self.profile.height = 175
        self.profile.weight = 70

    def test_lose_weight_target(self):
        self.profile.fitness_goal = 'lose_weight'
        self.profile.save()
        self.assertEqual(self.profile.daily_calorie_target, 1800)

    def test_maintain_target(self):
        self.profile.fitness_goal = 'maintain'
        self.profile.save()
        self.assertEqual(self.profile.daily_calorie_target, 2200)

    def test_build_muscle_target(self):
        self.profile.fitness_goal = 'build_muscle'
        self.profile.save()
        self.assertEqual(self.profile.daily_calorie_target, 3000)

    def test_water_intake_calculation(self):
        """Water intake = weight × 0.033 litres."""
        self.profile.weight = 70
        self.profile.fitness_goal = 'maintain'
        self.profile.save()
        self.assertAlmostEqual(self.profile.daily_water_intake, 2.3, delta=0.1)