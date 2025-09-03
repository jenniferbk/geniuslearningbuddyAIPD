'use client';

import { useState, useEffect, ReactNode } from 'react';
import AppNavigation from './AppNavigation';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AppLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export default function AppLayout({ children, requireAuth = false }: AppLayoutProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const userIdStr = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail');

      if (token && userIdStr && userName && userEmail) {
        setCurrentUser({
          id: userIdStr,
          name: userName,
          email: userEmail,
        });
      } else if (requireAuth) {
        // Redirect to login if auth is required but user is not logged in
        window.location.href = '/auth';
        return;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      if (requireAuth) {
        window.location.href = '/auth';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setCurrentUser(null);
    window.location.href = '/auth';
  };

  if (loading && requireAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation currentUser={currentUser} onLogout={handleLogout} />
      <main>{children}</main>
    </div>
  );
}