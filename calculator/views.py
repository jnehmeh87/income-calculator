from django.shortcuts import render
from .models import UserSettings
import json

def calculator_view(request):
    user_settings = None
    user_settings_json = '{}'
    if request.user.is_authenticated:
        user_settings, created = UserSettings.objects.get_or_create(user=request.user)
        user_settings_json = json.dumps({
            'transport_se': float(user_settings.transport_per_shift_se),
            'transport_gb': float(user_settings.transport_per_shift_gb),
            'transport_us': float(user_settings.transport_per_shift_us),
        })

    context = {
        'user_settings_json': user_settings_json
    }
    return render(request, 'calculator/index.html', context)
