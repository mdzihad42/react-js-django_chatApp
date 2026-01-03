from django.utils import timezone

class UpdateLastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            try:
                profile = request.user.userprofile
                profile.last_active = timezone.now()
                profile.save(update_fields=['last_active'])
                # print(f"Updated last_active for {request.user.username}") 
            except Exception as e:
                print(f"Error updating profile for {request.user.username}: {e}")
        # else:
            # print("User not authenticated in middleware")

        response = self.get_response(request)
        return response
