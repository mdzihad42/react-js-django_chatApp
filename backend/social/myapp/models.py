from django.db import models
from django.contrib.auth.models import User

from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

class ChatGroup(models.Model):
    name = models.CharField(max_length=255)
    members = models.ManyToManyField(User, related_name='chat_groups')
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='admin_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    last_active = models.DateTimeField(null=True, blank=True)
    bio = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    hobbies = models.CharField(max_length=255, blank=True, null=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    cover_pic = models.ImageField(upload_to='cover_pics/', blank=True, null=True)

    def __str__(self):
        return self.user.username

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'userprofile'):
        instance.userprofile.save()

# Simple Message Model
class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    content = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='message_images/', null=True, blank=True)
    video = models.FileField(upload_to='message_videos/', null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    # New fields for deletion logic
    is_unsent = models.BooleanField(default=False) # For "Unsend" (Delete for everyone)
    hidden_by = models.ManyToManyField(User, related_name='hidden_messages', blank=True) # For "Delete for me"

    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        if self.group:
            return f"{self.sender.username} in {self.group.name}: {self.content[:20] if self.content else 'Media'}"
        if self.receiver:
            return f"From {self.sender.username} to {self.receiver.username}: {self.content[:20] if self.content else 'Media'}"
        return f"From {self.sender.username}: {self.content if self.content else 'Media'}"
