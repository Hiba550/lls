# Generated by Django 4.2.10 on 2025-04-14 07:38

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_is_logged_in_user_last_activity_user_session_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='is_logged_in',
        ),
        migrations.RemoveField(
            model_name='user',
            name='last_activity',
        ),
        migrations.RemoveField(
            model_name='user',
            name='session_id',
        ),
    ]
