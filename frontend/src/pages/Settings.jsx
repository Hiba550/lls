import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import userApi from '../api/userApi';
import { toast } from 'react-toastify';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { currentUser, updateProfile, hasRole } = useAuth();
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isAdmin = hasRole('admin');
  
  // User profile state
  const [userProfile, setUserProfile] = useState({
    full_name: '',
    email: '',
    user_type: '',
    avatar: '',
    department: '',
    phone_number: ''
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    workOrderUpdates: true,
    inventoryAlerts: true,
    systemAnnouncements: false
  });
  
  // Application preferences
  const [preferences, setPreferences] = useState({
    defaultView: 'grid',
    autoRefresh: true,
    refreshInterval: 5,
    showCompletedWorkOrders: true
  });

  // User management state (for admin)
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    password_confirm: '',
    department: '',
    user_type: 'operator',
    phone_number: '',
    is_active: true
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [profileData, preferencesData] = await Promise.all([
          userApi.getProfile(),
          userApi.getPreferences()
        ]);
        
        setUserProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          user_type: profileData.user_type || '',
          avatar: profileData.avatar || '',
          department: profileData.department || '',
          phone_number: profileData.phone_number || ''
        });
        
        if (preferencesData) {
          // Set notifications if available
          if (preferencesData.notification_preferences) {
            setNotifications(preferencesData.notification_preferences);
          }
          
          // Set other preferences if available
          if (preferencesData.app_preferences) {
            setPreferences(preferencesData.app_preferences);
          }
        }

        // If user is admin, fetch all users
        if (isAdmin) {
          const usersData = await userApi.getAllUsers();
          setUsers(usersData);
        }
      } catch (error) {
        toast.error('Failed to load settings. Please try again later.');
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [isAdmin]);
  
  // Handle notification toggle
  const handleNotificationChange = (setting) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  // Handle preference changes
  const handlePreferenceChange = (setting, value) => {
    setPreferences(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Save profile changes
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(userProfile);
      setShowSavedMessage(true);
      toast.success('Profile updated successfully');
      setTimeout(() => setShowSavedMessage(false), 3000);
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Save notification settings
  const handleNotificationSave = async () => {
    try {
      setSaving(true);
      await userApi.updateNotificationSettings(notifications);
      setShowSavedMessage(true);
      toast.success('Notification settings saved');
      setTimeout(() => setShowSavedMessage(false), 3000);
    } catch (error) {
      toast.error('Failed to save notification settings. Please try again.');
      console.error('Error saving notification settings:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Save preferences
  const handlePreferencesSave = async () => {
    try {
      setSaving(true);
      await userApi.savePreferences(preferences);
      setShowSavedMessage(true);
      toast.success('Preferences saved successfully');
      setTimeout(() => setShowSavedMessage(false), 3000);
    } catch (error) {
      toast.error('Failed to save preferences. Please try again.');
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle input changes for profile
  const handleProfileChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('File too large. Please upload an image smaller than 2MB.');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const result = await userApi.uploadAvatar(formData, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      
      setUserProfile(prev => ({
        ...prev,
        avatar: result.avatar
      }));
      
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error('Failed to upload avatar. Please try again.');
      console.error('Error uploading avatar:', error);
    }
  };

  // Handle password change
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      setSaving(true);
      await userApi.changePassword(passwordData);
      toast.success('Password changed successfully');
      
      // Reset form
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      const errorMessage = error.response?.data?.old_password?.[0] || 
                          error.response?.data?.detail ||
                          'Failed to change password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // User management handlers (for admin)
  const handleUserFormChange = (field, value) => {
    setUserFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (userFormData.password !== userFormData.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setSaving(true);
      const newUser = await userApi.createUser(userFormData);
      
      // Add to users list
      setUsers(prev => [...prev, newUser]);
      
      // Close modal and reset form
      setShowUserModal(false);
      setUserFormData({
        email: '',
        full_name: '',
        password: '',
        password_confirm: '',
        department: '',
        user_type: 'operator',
        phone_number: '',
        is_active: true
      });
      
      toast.success('User created successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.email?.[0] || 
                          error.response?.data?.password?.[0] ||
                          'Failed to create user. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      email: user.email,
      full_name: user.full_name || '',
      password: '',
      password_confirm: '',
      department: user.department || '',
      user_type: user.user_type || 'operator',
      phone_number: user.phone_number || '',
      is_active: user.is_active
    });
    
    setShowUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Validate form if password is being updated
    if (userFormData.password && userFormData.password !== userFormData.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setSaving(true);
      
      // Create update data without password fields if they're empty
      const updateData = {...userFormData};
      if (!updateData.password) {
        delete updateData.password;
        delete updateData.password_confirm;
      }
      
      const updatedUser = await userApi.updateUser(selectedUser.id, updateData);
      
      // Update users list
      setUsers(prev => prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      // Close modal and reset
      setShowUserModal(false);
      setSelectedUser(null);
      
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user. Please try again.');
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await userApi.deleteUser(userId);
      
      // Remove from users list
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user. Please try again.');
      console.error('Error deleting user:', error);
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (user) => {
    try {
      const updatedUser = await userApi.updateUser(user.id, {
        is_active: !user.is_active
      });
      
      // Update users list
      setUsers(prev => prev.map(u => 
        u.id === updatedUser.id ? updatedUser : u
      ));
      
      toast.success(`User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update user status. Please try again.');
      console.error('Error updating user status:', error);
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-12 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">Settings</h2>
      
      {/* Success Message */}
      {showSavedMessage && (
        <div className="mb-6 p-3 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md text-green-700 dark:text-green-300">
          Settings saved successfully
        </div>
      )}
      
      {/* Theme Settings */}
      <section className="mb-10">
        <h3 className="text-lg font-medium mb-4">Theme Settings</h3>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toggle between light and dark appearance
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </section>
      
      {/* Profile Section */}
      <section className="mb-10">
        <h3 className="text-lg font-medium mb-4">User Profile</h3>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleProfileSave}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name"
                value={userProfile.full_name}
                onChange={(e) => handleProfileChange('full_name', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email"
                value={userProfile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="phone_number">Phone Number</label>
              <input 
                type="text" 
                id="phone_number"
                value={userProfile.phone_number}
                onChange={(e) => handleProfileChange('phone_number', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="department">Department</label>
              <input 
                type="text" 
                id="department"
                value={userProfile.department}
                onChange={(e) => handleProfileChange('department', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="role">Role</label>
              <input 
                type="text" 
                id="role"
                value={userProfile.user_type}
                disabled
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">Role can only be changed by an administrator</p>
            </div>
            
            {/* Avatar Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {userProfile.avatar ? (
                    <img 
                      src={userProfile.avatar} 
                      alt="User avatar" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Upload New Picture
                    <input 
                      type="file"
                      accept="image/jpeg, image/png, image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </section>

      {/* Password Change Section */}
      <section className="mb-10">
        <h3 className="text-lg font-medium mb-4">Change Password</h3>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="old_password">Current Password</label>
              <input 
                type="password" 
                id="old_password"
                value={passwordData.old_password}
                onChange={(e) => handlePasswordChange('old_password', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="new_password">New Password</label>
              <input 
                type="password" 
                id="new_password"
                value={passwordData.new_password}
                onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" htmlFor="confirm_password">Confirm New Password</label>
              <input 
                type="password" 
                id="confirm_password"
                value={passwordData.confirm_password}
                onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </section>
      
      {/* Notification Settings */}
      <section className="mb-10">
        <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            <li className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive important notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={notifications.emailNotifications}
                  onChange={() => handleNotificationChange('emailNotifications')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </li>
            <li className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Work Order Updates</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about work order status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={notifications.workOrderUpdates}
                  onChange={() => handleNotificationChange('workOrderUpdates')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </li>
            <li className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Inventory Alerts</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about low inventory items</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={notifications.inventoryAlerts}
                  onChange={() => handleNotificationChange('inventoryAlerts')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </li>
            <li className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">System Announcements</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about system updates and changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={notifications.systemAnnouncements}
                  onChange={() => handleNotificationChange('systemAnnouncements')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </li>
          </ul>
          
          <div className="mt-6">
            <button 
              onClick={handleNotificationSave}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Notification Settings'}
            </button>
          </div>
        </div>
      </section>
      
      {/* Application Preferences */}
      <section className="mb-10">
        <h3 className="text-lg font-medium mb-4">Application Preferences</h3>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="defaultView">Default View</label>
            <select 
              id="defaultView"
              value={preferences.defaultView}
              onChange={(e) => handlePreferenceChange('defaultView', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
              <option value="kanban">Kanban Board</option>
            </select>
          </div>
          
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-refresh Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically refresh data at specified intervals
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={preferences.autoRefresh}
                onChange={() => handlePreferenceChange('autoRefresh', !preferences.autoRefresh)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {preferences.autoRefresh && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" htmlFor="refreshInterval">Refresh Interval (minutes)</label>
              <select 
                id="refreshInterval"
                value={preferences.refreshInterval}
                onChange={(e) => handlePreferenceChange('refreshInterval', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          )}
          
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium">Show Completed Work Orders</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Display completed work orders in the work order list
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={preferences.showCompletedWorkOrders}
                onChange={() => handlePreferenceChange('showCompletedWorkOrders', !preferences.showCompletedWorkOrders)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={handlePreferencesSave}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </section>

      {/* User Management (Admin Only) */}
      {isAdmin && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">User Management</h3>
            <button
              onClick={() => {
                setSelectedUser(null);
                setUserFormData({
                  email: '',
                  full_name: '',
                  password: '',
                  password_confirm: '',
                  department: '',
                  user_type: 'operator',
                  phone_number: '',
                  is_active: true
                });
                setShowUserModal(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add New User
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {user.user_type_display || user.user_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => toggleUserStatus(user)}
                          className={`${
                            user.is_active ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                          } mr-4`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No users found. Click "Add New User" to create one.
              </div>
            )}
          </div>
        </section>
      )}

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {selectedUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="user_email">Email</label>
                <input 
                  type="email" 
                  id="user_email"
                  value={userFormData.email}
                  onChange={(e) => handleUserFormChange('email', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="user_full_name">Full Name</label>
                <input 
                  type="text" 
                  id="user_full_name"
                  value={userFormData.full_name}
                  onChange={(e) => handleUserFormChange('full_name', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="user_password">
                  {selectedUser ? 'Password (leave blank to keep unchanged)' : 'Password'}
                </label>
                <input 
                  type="password" 
                  id="user_password"
                  value={userFormData.password}
                  onChange={(e) => handleUserFormChange('password', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={!selectedUser}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="user_password_confirm">
                  Confirm Password
                </label>
                <input 
                  type="password" 
                  id="user_password_confirm"
                  value={userFormData.password_confirm}
                  onChange={(e) => handleUserFormChange('password_confirm', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={!selectedUser}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="user_department">Department</label>
                <input 
                  type="text" 
                  id="user_department"
                  value={userFormData.department}
                  onChange={(e) => handleUserFormChange('department', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="user_phone">Phone Number</label>
                <input 
                  type="text" 
                  id="user_phone"
                  value={userFormData.phone_number}
                  onChange={(e) => handleUserFormChange('phone_number', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="user_type">Role</label>
                <select 
                  id="user_type"
                  value={userFormData.user_type}
                  onChange={(e) => handleUserFormChange('user_type', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="operator">Operator</option>
                  <option value="qc">Quality Control</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              
              <div className="mb-6 flex items-center">
                <input 
                  type="checkbox" 
                  id="user_active"
                  checked={userFormData.is_active}
                  onChange={(e) => handleUserFormChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="user_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Active Account
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : selectedUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;