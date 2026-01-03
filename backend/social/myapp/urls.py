from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, CurrentUserView, UserListView, MessageViewSet, ChatGroupViewSet, UserProfileUpdateView

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='messages')
router.register(r'groups', ChatGroupViewSet, basename='groups')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('auth/profile/', UserProfileUpdateView.as_view(), name='update_profile'),
    path('users/', UserListView.as_view(), name='user-list'),
]
