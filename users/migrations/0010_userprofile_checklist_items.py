from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_userprofile_date_of_birth_remove_age'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='checklist_items',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='List of active daily checklist item keys chosen by the user',
            ),
        ),
    ]