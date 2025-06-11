from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import Notification, NotificationTemplate, NotificationPreference, NotificationLog
from .serializers import (
    NotificationSerializer, 
    NotificationCreateSerializer,
    NotificationTemplateSerializer,
    NotificationPreferenceSerializer,
    NotificationStatsSerializer,
    BulkMarkReadSerializer,
    NotificationActionSerializer
)

User = get_user_model()

class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter notifications for the current user"""
        user = self.request.user
        queryset = Notification.objects.filter(recipient=user)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by notification type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get notification statistics for the current user"""
        user = request.user
        notifications = Notification.objects.filter(recipient=user)
        
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        stats = {
            'total_notifications': notifications.count(),
            'unread_count': notifications.filter(is_read=False).count(),
            'today_count': notifications.filter(created_at__gte=today).count(),
            'high_priority_count': notifications.filter(
                priority__in=['high', 'urgent'], 
                is_read=False
            ).count(),
            'categories': dict(
                notifications.values('category')
                .annotate(count=Count('id'))
                .values_list('category', 'count')
            )
        }
        
        serializer = NotificationStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        user = request.user
        serializer = BulkMarkReadSerializer(data=request.data)
        
        if serializer.is_valid():
            notification_ids = serializer.validated_data.get('notification_ids', [])
            
            if notification_ids:
                # Mark specific notifications as read
                notifications = Notification.objects.filter(
                    recipient=user,
                    id__in=notification_ids,
                    is_read=False
                )
            else:
                # Mark all notifications as read
                notifications = Notification.objects.filter(
                    recipient=user,
                    is_read=False
                )
            
            count = notifications.count()
            now = timezone.now()
            
            # Bulk update
            notifications.update(is_read=True, read_at=now)
            
            # Create log entries
            for notification in notifications:
                NotificationLog.objects.create(
                    notification=notification,
                    action='read',
                    metadata={'marked_by': user.email, 'bulk_action': True}
                )
            
            return Response({
                'message': f'{count} notifications marked as read',
                'count': count
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        
        if not notification.is_read:
            notification.mark_as_read()
            
            # Create log entry
            NotificationLog.objects.create(
                notification=notification,
                action='read',
                metadata={'marked_by': request.user.email}
            )
        
        return Response({'message': 'Notification marked as read'})
    
    @action(detail=True, methods=['post'])
    def take_action(self, request, pk=None):
        """Mark that user has taken action on notification"""
        notification = self.get_object()
        
        if not notification.action_taken:
            notification.mark_action_taken()
            
            # Create log entry
            NotificationLog.objects.create(
                notification=notification,
                action='action_taken',
                metadata={'action_by': request.user.email}
            )
        
        return Response({'message': 'Action recorded for notification'})
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on notifications"""
        serializer = NotificationActionSerializer(data=request.data)
        
        if serializer.is_valid():
            action = serializer.validated_data['action']
            notification_ids = serializer.validated_data['notification_ids']
            
            notifications = Notification.objects.filter(
                recipient=request.user,
                id__in=notification_ids
            )
            
            count = notifications.count()
            
            if action == 'mark_read':
                notifications.filter(is_read=False).update(is_read=True, read_at=timezone.now())
            elif action == 'mark_unread':
                notifications.filter(is_read=True).update(is_read=False, read_at=None)
            elif action == 'delete':
                notifications.delete()
            elif action == 'take_action':
                notifications.filter(action_taken=False).update(
                    action_taken=True, 
                    action_taken_at=timezone.now()
                )
            
            return Response({
                'message': f'{action} performed on {count} notifications',
                'count': count
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent notifications (last 50)"""
        notifications = self.get_queryset()[:50]
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notification preferences
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create notification preferences for the current user"""
        obj, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj
    
    def update(self, request, *args, **kwargs):
        """Update notification preferences"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NotificationTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing notification templates (read-only for users)
    """
    queryset = NotificationTemplate.objects.filter(is_active=True)
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

# Utility functions for creating notifications
def create_notification(recipient, title, message, category='system', 
                       notification_type='info', priority='medium', 
                       action_url=None, metadata=None, related_object_type=None, 
                       related_object_id=None):
    """
    Utility function to create notifications programmatically
    """
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        category=category,
        notification_type=notification_type,
        priority=priority,
        action_url=action_url,
        metadata=metadata or {},
        related_object_type=related_object_type or '',
        related_object_id=related_object_id or ''
    )

def create_work_order_notification(recipient, work_order, action='created'):
    """Create notification for work order events"""
    action_messages = {
        'created': f'New work order #{work_order.id} has been created',
        'assigned': f'Work order #{work_order.id} has been assigned to you',
        'completed': f'Work order #{work_order.id} has been completed',
        'cancelled': f'Work order #{work_order.id} has been cancelled',
    }
    
    return create_notification(
        recipient=recipient,
        title=f'Work Order {action.title()}',
        message=action_messages.get(action, f'Work order #{work_order.id} updated'),
        category='work_order',
        notification_type='info' if action in ['created', 'assigned'] else 'success',
        priority='medium',
        action_url=f'/work-orders/{work_order.id}',
        related_object_type='work_order',
        related_object_id=str(work_order.id),
        metadata={
            'work_order_id': work_order.id,
            'product': work_order.product,
            'item_code': work_order.item_code,
            'action': action
        }
    )

def create_assembly_notification(recipient, assembly_id, action='completed'):
    """Create notification for assembly events"""
    action_messages = {
        'started': f'Assembly #{assembly_id} has been started',
        'completed': f'Assembly #{assembly_id} has been completed successfully',
        'failed': f'Assembly #{assembly_id} has failed quality check',
        'rework': f'Assembly #{assembly_id} requires rework',
    }
    
    notification_types = {
        'started': 'info',
        'completed': 'success',
        'failed': 'error',
        'rework': 'warning'
    }
    
    priorities = {
        'started': 'low',
        'completed': 'medium',
        'failed': 'high',
        'rework': 'high'
    }
    
    return create_notification(
        recipient=recipient,
        title=f'Assembly {action.title()}',
        message=action_messages.get(action, f'Assembly #{assembly_id} updated'),
        category='assembly',
        notification_type=notification_types.get(action, 'info'),
        priority=priorities.get(action, 'medium'),
        action_url=f'/assembly/{assembly_id}',
        related_object_type='assembly',
        related_object_id=str(assembly_id),
        metadata={
            'assembly_id': assembly_id,
            'action': action
        }
    )

def create_inventory_notification(recipient, item_code, current_stock, threshold):
    """Create notification for low inventory"""
    return create_notification(
        recipient=recipient,
        title='Low Inventory Alert',
        message=f'Item {item_code} stock is low: {current_stock} units (threshold: {threshold})',
        category='inventory',
        notification_type='warning',
        priority='high',
        action_url=f'/inventory/components/{item_code}',
        related_object_type='inventory_item',
        related_object_id=item_code,
        metadata={
            'item_code': item_code,
            'current_stock': current_stock,
            'threshold': threshold
        }
    )
