from django.db import migrations, models


def backfill_freeze_tokens(apps, schema_editor):
    StreakRecord = apps.get_model('meals', 'StreakRecord')
    StreakRecord.objects.filter(freeze_tokens__lt=3).update(freeze_tokens=3)


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0013_mealplan_snacks'),
    ]

    operations = [  
        migrations.AddField(
            model_name='streakrecord',
            name='freeze_reset_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='streakrecord',
            name='freeze_tokens',
            field=models.IntegerField(default=3),
        ),
        migrations.RunPython(backfill_freeze_tokens, migrations.RunPython.noop),
    ]