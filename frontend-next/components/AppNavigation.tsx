'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Settings, BookOpen, Home, User, LogOut } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AppNavigationProps {
  currentUser?: User;
  onLogout?: () => void;
}

export default function AppNavigation({ currentUser, onLogout }: AppNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasCreatorPermissions, setHasCreatorPermissions] = useState(false);

  useEffect(() => {
    if (currentUser) {
      checkCreatorPermissions();
    }
  }, [currentUser]);

  const checkCreatorPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/cms/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setHasCreatorPermissions(response.ok);
    } catch (error) {
      console.error('Error checking creator permissions:', error);
      setHasCreatorPermissions(false);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Courses', href: '/courses', icon: BookOpen },
  ];

  if (hasCreatorPermissions) {
    navigationItems.push({ name: 'Content Manager', href: '/cms', icon: Settings });
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold text-blue-600">
              AI Learning Buddy
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {currentUser ? (
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-700 text-sm">
                      Welcome, {currentUser.name}
                    </span>
                    <button
                      onClick={onLogout}
                      className="text-gray-600 hover:text-red-600 p-2 rounded-md transition-colors"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <a
                    href="/auth"
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </a>
                  <a
                    href="/auth"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-blue-600 p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </a>
              );
            })}
            
            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {currentUser ? (
                <>
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="h-5 w-5" />
                      <span className="text-sm">{currentUser.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full text-left text-red-600 hover:bg-red-50 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <a
                    href="/auth"
                    className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </a>
                  <a
                    href="/auth"
                    className="bg-blue-600 text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}