from rest_framework import viewsets, permissions, status, views, generics, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.contrib.auth.models import User
from .models import Message, ChatGroup, UserProfile
from .serializers import UserSerializer, RegisterSerializer, MessageSerializer, ChatGroupSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserProfileUpdateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def put(self, request):
        return self.update_profile(request)

    def patch(self, request):
        return self.update_profile(request)

    def update_profile(self, request):
        user = request.user
        # Ensure profile exists safely
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        # Update User fields using .get() to avoid overwriting with None if key missing
        # If the key is present but empty, it will be updated to empty.
        # If the key is NOT present, it keeps the old value.
        if 'first_name' in request.data: 
            user.first_name = request.data['first_name']
        if 'last_name' in request.data: 
            user.last_name = request.data['last_name']
        if 'email' in request.data: 
            user.email = request.data['email']
        user.save()

        # Update Profile fields - safer checks
        if 'bio' in request.data: 
            profile.bio = request.data['bio']
        if 'address' in request.data: 
            profile.address = request.data['address']
        if 'hobbies' in request.data: 
            profile.hobbies = request.data['hobbies']
        
        # Handle Files
        if 'profile_pic' in request.FILES: 
            profile.profile_pic = request.FILES['profile_pic']
        if 'cover_pic' in request.FILES: 
            profile.cover_pic = request.FILES['cover_pic']
        
        profile.save()
        
        # Return updated user data
        return Response(UserSerializer(user).data)

class UserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        # Return all users except self
        return User.objects.exclude(id=self.request.user.id)

class ChatGroupViewSet(viewsets.ModelViewSet):
    serializer_class = ChatGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatGroup.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        group = serializer.save(admin=self.request.user)
        group.members.add(self.request.user)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        user = self.request.user
        # Messages: Direct (Sender/Receiver) OR Group (Member)
        # AND exclude messages hidden by this user
        queryset = Message.objects.filter(
            Q(sender=user) | 
            Q(receiver=user) | 
            Q(group__members=user)
        ).exclude(hidden_by=user).distinct()
        
        # Filter: Direct Conversation
        other_user_id = self.request.query_params.get('user_id')
        if other_user_id:
            queryset = queryset.filter(
                (Q(sender_id=other_user_id) | Q(receiver_id=other_user_id)) & Q(group__isnull=True)
            )
        
        # Filter: Group Conversation
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(group_id=group_id)

        return queryset

    @action(detail=True, methods=['post'])
    def unsend(self, request, pk=None):
        message = self.get_object()
        if message.sender == request.user:
            message.is_unsent = True
            message.save()
            return Response({'status': 'unsent'})
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def hide(self, request, pk=None):
        message = self.get_object()
        # Anyone involved can hide copy for themselves
        message.hidden_by.add(request.user)
        return Response({'status': 'hidden'})

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        user = request.user
        
        # 1. Direct Contacts
        sent_to = Message.objects.filter(sender=user, group__isnull=True).values_list('receiver', flat=True)
        received_from = Message.objects.filter(receiver=user, group__isnull=True).values_list('sender', flat=True)
        contact_ids = set(sent_to) | set(received_from)
        if None in contact_ids: contact_ids.remove(None)
        
        contacts = User.objects.filter(id__in=contact_ids)
        contact_data = UserSerializer(contacts, many=True).data
        # Add type tag
        for c in contact_data: c['type'] = 'user'

        # 2. Groups
        groups = ChatGroup.objects.filter(members=user)
        group_data = ChatGroupSerializer(groups, many=True).data
        for g in group_data: g['type'] = 'group'

        # Combine
        return Response(contact_data + group_data)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
