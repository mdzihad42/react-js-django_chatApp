from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Message, ChatGroup

from django.utils import timezone
from datetime import timedelta

class UserSerializer(serializers.ModelSerializer):
    last_active = serializers.DateTimeField(source='userprofile.last_active', read_only=True)
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'last_active', 'is_online']
    
    def get_is_online(self, obj):
        try:
            if obj.userprofile.last_active:
                return timezone.now() - obj.userprofile.last_active < timedelta(minutes=1)
        except:
            pass
        return False

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class ChatGroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True
    )

    class Meta:
        model = ChatGroup
        fields = ['id', 'name', 'members', 'member_ids', 'admin', 'created_at']
        read_only_fields = ['admin', 'created_at']

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids')
        group = ChatGroup.objects.create(**validated_data)
        group.members.set(member_ids)
        # We also usually add the admin to members if not present
        return group


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    group = ChatGroupSerializer(read_only=True)
    
    receiver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='receiver', write_only=True, required=False, allow_null=True
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=ChatGroup.objects.all(), source='group', write_only=True, required=False, allow_null=True
    )
    
    image = serializers.ImageField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'group', 'group_id', 'content', 'image', 'video', 'timestamp', 'is_read', 'is_unsent']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.is_unsent:
            ret['content'] = 'Message unsent'
            ret['image'] = None
            ret['video'] = None
        return ret

    def validate(self, data):
        if not data.get('receiver') and not data.get('group'):
            raise serializers.ValidationError("Must provide either receiver_id or group_id")
        return data
