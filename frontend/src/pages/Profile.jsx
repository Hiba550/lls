import React, { useState, useEffect } from 'react';
import userApi from '../api/userApi';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    phone_number: ''
  });

  useEffect(() => {
    // Load user profile data
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Try to get profile from the profile endpoint first
        let profileResponse;
        try {
          profileResponse = await userApi.getProfile();
        } catch (profileError) {
          console.warn('Profile endpoint failed, trying getCurrentUser:', profileError);
          // Fallback to getCurrentUser if profile endpoint fails
          profileResponse = await userApi.getCurrentUser();
        }
        
        const userData = profileResponse.data || profileResponse;
        setUser(userData);
        setFormData({
          full_name: userData.full_name || '',
          email: userData.email || '',
          department: userData.department || '',
          phone_number: userData.phone_number || ''
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load your profile data. The profile service may be temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await userApi.updateProfile(formData);
      setUser(response.data);
      alert('Profile updated successfully.');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update your profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-neutral-800 py-2 px-3 shadow-sm opacity-75"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
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
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
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
}

export default Profile;