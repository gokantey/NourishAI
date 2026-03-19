from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0009_notification'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyCheckin',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('completed_items', models.JSONField(default=list)),
                ('items_completed', models.IntegerField(default=0)),
                ('is_consistent', models.BooleanField(default=False)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='checkins', to='auth.user')),
            ],
            options={'ordering': ['-date'], 'unique_together': {('user', 'date')}},
        ),
        migrations.CreateModel(
            name='StreakRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('current_streak', models.IntegerField(default=0)),
                ('longest_streak', models.IntegerField(default=0)),
                ('last_active_date', models.DateField(blank=True, null=True)),
                ('freeze_tokens', models.IntegerField(default=1)),
                ('total_active_days', models.IntegerField(default=0)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='streak', to='auth.user')),
            ],
        ),
        migrations.CreateModel(
            name='Achievement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('slug', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=80)),
                ('description', models.CharField(max_length=200)),
                ('icon', models.CharField(default='🏆', max_length=10)),
            ],
        ),
        migrations.CreateModel(
            name='UserAchievement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('unlocked_at', models.DateTimeField(auto_now_add=True)),
                ('achievement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='meals.achievement')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='achievements', to='auth.user')),
            ],
            options={'ordering': ['-unlocked_at'], 'unique_together': {('user', 'achievement')}},
        ),
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(
                choices=[
                    ('plan_generated', 'Plan Generated'), ('plan_saved', 'Plan Saved'),
                    ('upgrade', 'Upgraded to Premium'), ('cancelled', 'Subscription Cancelled'),
                    ('payment_failed', 'Payment Failed'), ('save_limit', 'Save Limit Reached'),
                    ('weekly_summary', 'Weekly Summary'), ('achievement', 'Achievement Unlocked'),
                    ('streak', 'Streak Milestone'), ('checkin_reminder', 'Check-in Reminder'),
                    ('general', 'General'),
                ],
                default='general', max_length=30,
            ),
        ),
    ]