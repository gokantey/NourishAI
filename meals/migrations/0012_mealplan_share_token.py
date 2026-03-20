import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0011_alter_achievement_id_alter_dailycheckin_id_and_more'),  
    ]

    operations = [
        migrations.AddField(
            model_name='mealplan',
            name='share_token',
            field=models.UUIDField(
                default=None, null=True, blank=True, unique=True,
                help_text='Public share token — generated on first share',
            ),
        ),
    ]