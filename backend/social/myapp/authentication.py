from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone

class ActiveUserJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        
        user, token = result
        # Update last_active
        if hasattr(user, 'userprofile'):
            user.userprofile.last_active = timezone.now()
            user.userprofile.save(update_fields=['last_active'])
            
        return user, token
