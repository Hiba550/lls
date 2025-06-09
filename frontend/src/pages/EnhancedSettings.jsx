import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  BellIcon, 
  CogIcon, 
  ShieldCheckIcon, 
  UsersIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  KeyIcon,
  LockClosedIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import userApi from '../api/userApi';
import { toast } from 'react-toastify';

const EnhancedSettings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { currentUser, updateProfile, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const isAdmin = hasRole('admin');
  
  // User profile state
  const [userProfile, setUserProfile] = useState({
    full_name: '',
    email: '',
    user_type: '',
    avatar: '',
    department: '',
    phone_number: '',
    employee_id: '',
    emergency_contact: ''
  });

  // User management state
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    workOrderUpdates: true,
    inventoryAlerts: true,
    systemAnnouncements: false,
    maintenanceAlerts: true,
    qualityAlerts: false
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    defaultView: 'grid',
    autoRefresh: true,
    refreshInterval: 30,
    showCompletedWorkOrders: true,
    itemsPerPage: 10,
    defaultSortOrder: 'desc',
    language: 'en',
    timezone: 'UTC'
  });

  // Security state
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    force_password_change: false,
    password_expires_at: null,
    account_locked_until: null
  });

  // User statistics
  const [userStats, setUserStats] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    users_by_role: {},
    users_by_department: {},
    recent_logins: 0,
    locked_accounts: 0
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  // New user form state
  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    password: '',
    password_confirm: '',
    department: 'operations',
    user_type: 'worker',
    phone_number: '',
    employee_id: '',
    supervisor: '',
    emergency_contact: '',
    notes: ''
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon, roles: ['admin', 'planner', 'worker'] },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, roles: ['admin', 'planner', 'worker'] },
    { id: 'preferences', name: 'Preferences', icon: CogIcon, roles: ['admin', 'planner', 'worker'] },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon, roles: ['admin', 'planner', 'worker'] },
    { id: 'users', name: 'User Management', icon: UsersIcon, roles: ['admin'] },
    { id: 'analytics', name: 'User Analytics', icon: ChartBarIcon, roles: ['admin'] }
  ];

  const availableTabs = tabs.filter(tab => 
    tab.roles.includes(currentUser?.user_type || 'worker')
  );

  const departmentOptions = [
    { value: 'operations', label: 'Operations' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'quality', label: 'Quality' },
    { value: 'planning', label: 'Planning' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' }
  ];

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'planner', label: 'Planner' },
    { value: 'worker', label: 'Worker' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending' }
  ];

  // Load initial data
  useEffect(() => {
    loadUserData();
    if (isAdmin) {
      loadUsers();
      loadUserStats();
    }
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole) {
      filtered = filtered.filter(user => user.user_type === filterRole);
    }

    if (filterDepartment) {
      filtered = filtered.filter(user => user.department === filterDepartment);
    }

    if (filterStatus) {
      if (filterStatus === 'active') {
        filtered = filtered.filter(user => user.is_active);
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(user => !user.is_active);
      } else {
        filtered = filtered.filter(user => user.status === filterStatus);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterDepartment, filterStatus]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [profileData, preferencesData, securityData] = await Promise.all([
        userApi.getProfile(),
        userApi.getPreferences(),
        userApi.getUserSecurity()
      ]);

      setUserProfile(profileData);
      
      if (preferencesData) {
        setNotifications(preferencesData.notification_preferences || notifications);
        setPreferences(preferencesData.app_preferences || preferences);
      }

      if (securityData) {
        setSecuritySettings(securityData);
      }
    } catch (error) {
      toast.error('Failed to load user data');
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await userApi.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error loading users:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const statsData = await userApi.getUserStats();
      setUserStats(statsData);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await userApi.updateProfile(userProfile);
      await updateProfile(userProfile);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      await userApi.updatePreferences({
        notification_preferences: notifications
      });
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update notifications');
      console.error('Error updating notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setLoading(true);
      await userApi.updatePreferences({
        app_preferences: preferences
      });
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await userApi.changePassword(passwordData);
      toast.success('Password changed successfully');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error('Failed to change password');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (newUserData.password !== newUserData.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await userApi.createUser(newUserData);
      toast.success('User created successfully');
      setShowUserModal(false);
      setNewUserData({
        email: '',
        full_name: '',
        password: '',
        password_confirm: '',
        department: 'operations',
        user_type: 'worker',
        phone_number: '',
        employee_id: '',
        supervisor: '',
        emergency_contact: '',
        notes: ''
      });
      loadUsers();
      loadUserStats();
    } catch (error) {
      toast.error('Failed to create user');
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users first');
      return;
    }

    try {
      setLoading(true);
      await userApi.bulkUpdateUsers({
        user_ids: selectedUsers,
        action: action
      });
      toast.success(`Bulk ${action} completed successfully`);
      setSelectedUsers([]);
      loadUsers();
      loadUserStats();
    } catch (error) {
      toast.error(`Failed to perform bulk ${action}`);
      console.error(`Error performing bulk ${action}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const resetPassword = async (userId) => {
    try {
      setLoading(true);
      await userApi.resetUserPassword(userId, {
        new_password: 'TempPass123!',
        force_change: true
      });
      toast.success('Password reset successfully. User will be prompted to change it on next login.');
    } catch (error) {
      toast.error('Failed to reset password');
      console.error('Error resetting password:', error);
    } finally {
      setLoading(false);
    }
  };

  const lockUser = async (userId) => {
    try {
      setLoading(true);
      await userApi.lockUser(userId);
      toast.success('User account locked');
      loadUsers();
    } catch (error) {
      toast.error('Failed to lock user');
      console.error('Error locking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockUser = async (userId) => {
    try {
      setLoading(true);
      await userApi.unlockUser(userId);
      toast.success('User account unlocked');
      loadUsers();
    } catch (error) {
      toast.error('Failed to unlock user');
      console.error('Error unlocking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = async () => {
    try {
      const data = await userApi.exportUsers();
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'users.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Users exported successfully');
    } catch (error) {
      toast.error('Failed to export users');
      console.error('Error exporting users:', error);
    }
  };

  const importUsers = async (file) => {
    try {
      setLoading(true);
      const result = await userApi.importUsers(file);
      toast.success(`Successfully imported ${result.created_users?.length || 0} users`);
      if (result.errors?.length > 0) {
        console.warn('Import errors:', result.errors);
      }
      loadUsers();
      loadUserStats();
    } catch (error) {
      toast.error('Failed to import users');
      console.error('Error importing users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Personal Information
        </h3>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                value={userProfile.full_name}
                onChange={(e) => setUserProfile(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={userProfile.email}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 shadow-sm bg-gray-50 dark:bg-gray-800"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                value={userProfile.phone_number}
                onChange={(e) => setUserProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Employee ID
              </label>
              <input
                type="text"
                value={userProfile.employee_id}
                onChange={(e) => setUserProfile(prev => ({ ...prev, employee_id: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                value={userProfile.department}
                onChange={(e) => setUserProfile(prev => ({ ...prev, department: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {departmentOptions.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Emergency Contact
              </label>
              <input
                type="text"
                value={userProfile.emergency_contact}
                onChange={(e) => setUserProfile(prev => ({ ...prev, emergency_contact: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.old_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Notification Preferences
      </h3>
      
      <div className="space-y-4">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
              className={`${
                value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  value ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleNotificationUpdate}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Notifications'}
        </button>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Application Preferences
      </h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Default View
          </label>
          <select
            value={preferences.defaultView}
            onChange={(e) => setPreferences(prev => ({ ...prev, defaultView: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="grid">Grid View</option>
            <option value="list">List View</option>
            <option value="card">Card View</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto Refresh Interval (seconds)
          </label>
          <select
            value={preferences.refreshInterval}
            onChange={(e) => setPreferences(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="15">15 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Items Per Page
          </label>
          <select
            value={preferences.itemsPerPage}
            onChange={(e) => setPreferences(prev => ({ ...prev, itemsPerPage: parseInt(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Auto Refresh</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatically refresh data</p>
          </div>
          <button
            type="button"
            onClick={() => setPreferences(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
            className={`${
              preferences.autoRefresh ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                preferences.autoRefresh ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Use dark theme</p>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`${
              darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                darkMode ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={handlePreferencesUpdate}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Preferences'}
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Security Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
            </div>
            <button
              type="button"
              onClick={() => setSecuritySettings(prev => ({ ...prev, two_factor_enabled: !prev.two_factor_enabled }))}
              className={`${
                securitySettings.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  securitySettings.two_factor_enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Account Status</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {securitySettings.account_locked_until 
                    ? `Locked until ${new Date(securitySettings.account_locked_until).toLocaleString()}`
                    : 'Active'
                  }
                </p>
              </div>
              {securitySettings.account_locked_until && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Locked
                </span>
              )}
            </div>
          </div>

          {securitySettings.force_password_change && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center space-x-2">
                <KeyIcon className="h-5 w-5 text-yellow-500" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Password change required on next login
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Active Sessions
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          View and manage your active login sessions
        </p>
        <button
          onClick={() => {/* Load and show sessions */}}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          View Sessions
        </button>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {userStats.total_users}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {userStats.active_users}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <LockClosedIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Locked Accounts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {userStats.locked_accounts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Recent Logins
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {userStats.recent_logins}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Controls */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            User Management
          </h3>
          <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-2">
            <button
              onClick={() => setShowUserModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add User
            </button>
            <button
              onClick={exportUsers}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Export
            </button>
            <label className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
              <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
              Import
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files[0] && importUsers(e.target.files[0])}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departmentOptions.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('unlock_account')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Unlock
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={user.avatar || '/default-avatar.png'} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {user.user_type_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.department_display}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {user.is_account_locked && (
                      <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Locked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {setEditingUser(user); setShowUserModal(true);}}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => resetPassword(user.id)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        title="Reset Password"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                      {user.is_account_locked ? (
                        <button
                          onClick={() => unlockUser(user.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Unlock Account"
                        >
                          <LockClosedIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => lockUser(user.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Lock Account"
                        >
                          <LockClosedIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          User Analytics Dashboard
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Users by Role</h4>
            <div className="space-y-2">
              {Object.entries(userStats.users_by_role || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{role}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Users by Department</h4>
            <div className="space-y-2">
              {Object.entries(userStats.users_by_department || {}).map(([dept, count]) => (
                <div key={dept} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{dept}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSettings;
