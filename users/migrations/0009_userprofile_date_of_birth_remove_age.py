from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_userprofile_generation_reset_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='date_of_birth',
            field=models.DateField(
                blank=True,
                null=True,
                help_text="User's date of birth (DD/MM/YYYY)"
            ),
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='age',
        ),
    ]