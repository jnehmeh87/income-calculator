from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='usersettings')
    
    # Country-specific settings that can be overridden
    transport_per_shift_se = models.DecimalField(max_digits=10, decimal_places=2, default=79.00)
    transport_per_shift_gb = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    transport_per_shift_us = models.DecimalField(max_digits=10, decimal_places=2, default=15.00)

    # Add other customizable fields here in the future
    # e.g., vacation_pay_rate, pension_rate, etc.

    def __str__(self):
        return f"{self.user.username}'s Settings"

@receiver(post_save, sender=User)
def create_or_update_user_settings(sender, instance, created, **kwargs):
    """Create or update the user settings when a user is created or saved."""
    if created:
        UserSettings.objects.create(user=instance)
    instance.usersettings.save()
    instance.usersettings.save()
