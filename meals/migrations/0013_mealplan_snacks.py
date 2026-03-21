from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0012_mealplan_share_token'),
    ]

    operations = [
        migrations.AddField(
            model_name='mealplan',
            name='snacks',
            field=models.JSONField(
                blank=True, null=True, default=None,
                help_text='AI-generated snacks per day',
            ),
        ),
    ]