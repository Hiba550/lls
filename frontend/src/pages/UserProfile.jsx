import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const UserProfile = () => {
  const { currentUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    full_name: '',
    email: '',
    department: '',
    phone_number: '',
    avatar: null
  });

  // Load user data
  useEffect(() => {
    if (currentUser) {
      setUserProfile({
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        department: currentUser.department || '',
        phone_number: currentUser.phone_number || '',
        avatar: currentUser.avatar || null
      });
      setLoading(false);
    } else {
      // If auth context doesn't have user data, fetch it from API
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/profile/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          
          if (!response.ok) {
            // If profile endpoint fails, try to use auth context data or show error
            if (response.status === 500) {
              toast.error('Profile service is temporarily unavailable. Some features may not work correctly.');
              // Use any available auth data
              if (currentUser) {
                setUserProfile({
                  full_name: currentUser.full_name || '',
                  email: currentUser.email || '',
                  department: currentUser.department || '',
                  phone_number: currentUser.phone_number || '',
                  avatar: currentUser.avatar || null
                });
              }
              return;
            }
            throw new Error('Failed to fetch user data');
          }
          
          const userData = await response.json();
          setUserProfile({
            full_name: userData.full_name || '',
            email: userData.email || '',
            department: userData.department || '',
            phone_number: userData.phone_number || '',
            avatar: userData.avatar || null
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          toast.error('Failed to load user profile. Please try refreshing the page.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [currentUser]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          full_name: userProfile.full_name,
          department: userProfile.department,
          phone_number: userProfile.phone_number
        })
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedProfile = await response.json();
      toast.success('Profile updated successfully');
      
      // Update local state and context
      setUserProfile(prev => ({
        ...prev,
        ...updatedProfile
      }));
      
      if (updateUser) {
        updateUser(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      
      <div className="bg-white dark:bg-neutral-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={userProfile.full_name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={userProfile.email}
                disabled
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-neutral-800 py-2 px-3 shadow-sm opacity-75"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={userProfile.department}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone_number"
                value={userProfile.phone_number}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 bg-white dark:bg-neutral-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Password</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You can change your password from the settings page.
        </p>
        <button
          onClick={() => window.location.href = '/settings'}
          className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Go to Settings
        </button>
      </div>
    </div>
  );
};

export default UserProfile;