from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, UserPreference

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('employee_id', 'email', 'full_name', 'user_type', 'department', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_active', 'is_staff')
    search_fields = ('employee_id', 'email', 'full_name', 'department')
    ordering = ('employee_id',)
    fieldsets = (
        (None, {'fields': ('email', 'employee_id', 'password')}),
        (_('Personal info'), {'fields': ('full_name', 'phone_number', 'avatar')}),
        (_('Work info'), {'fields': ('department', 'user_type')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'employee_id', 'full_name', 'password1', 'password2', 'user_type', 'department'),
        }),
    )

@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'dark_mode', 'updated_at')
    search_fields = ('user__employee_id', 'user__email', 'user__full_name')
    list_filter = ('dark_mode',)
