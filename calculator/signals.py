from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import UserSettings

@receiver(post_save, sender=User)
def create_or_update_user_settings(sender, instance, created, **kwargs):
    """Create or update the user settings when a user is created or saved."""
    if created:
        UserSettings.objects.create(user=instance)
    else:
        instance.usersettings.save()
