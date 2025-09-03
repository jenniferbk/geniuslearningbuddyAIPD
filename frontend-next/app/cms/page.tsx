'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import CourseManagerDashboard from '../../components/cms/CourseManagerDashboard';

export default function CMSDashboard() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkAuthAndPermissions();
  }, []);

  const checkAuthAndPermissions = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('userId');

      if (!token || !storedUserId) {
        window.location.href = '/auth';
        return;
      }

      setUserToken(token);
      setUserId(storedUserId);

      // Check if user has CMS permissions
      const response = await fetch('http://localhost:3001/api/cms/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setHasPermission(true);
      } else if (response.status === 403) {
        setHasPermission(false);
      } else {
        throw new Error('Failed to check permissions');
      }
    } catch (error) {
      console.error('Error checking auth/permissions:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!hasPermission) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the Course Management System. 
              Please contact an administrator to request creator permissions.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!userToken || !userId) {
    window.location.href = '/auth';
    return null;
  }

  return (
    <AppLayout>
      <CourseManagerDashboard userToken={userToken} userId={userId} />
    </AppLayout>
  );
}