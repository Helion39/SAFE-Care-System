import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  HeartIcon as HeartIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';

const Layout = ({ children }) => {
  const { user, resident, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Vitals',
      href: '/vitals',
      icon: HeartIcon,
      iconSolid: HeartIconSolid,
      current: location.pathname === '/vitals'
    },
    {
      name: 'Incidents',
      href: '/incidents',
      icon: ExclamationTriangleIcon,
      iconSolid: ExclamationTriangleIconSolid,
      current: location.pathname === '/incidents'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      iconSolid: UserIconSolid,
      current: location.pathname === '/profile'
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-accent to-primary-300 rounded-lg flex items-center justify-center">
                <HeartIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">SAFE Care</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 px-4 py-6">
            {/* User Info */}
            <div className="mb-6 p-4 bg-gradient-to-r from-accent/10 to-primary-100/50 rounded-xl">
              <div className="flex items-center space-x-3">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gradient-to-br from-accent to-primary-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {resident?.name}'s {user?.relationship}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.current ? item.iconSolid : item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      item.current
                        ? 'bg-gradient-to-r from-accent to-primary-300 text-white shadow-soft'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout Button */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-accent to-primary-300 rounded-xl flex items-center justify-center">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">SAFE Care</h1>
                <p className="text-xs text-gray-600">Family Portal</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-br from-accent to-primary-300 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {resident?.name}'s {user?.relationship}
                </p>
                <p className="text-xs text-gray-500">
                  Room {resident?.room}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.current ? item.iconSolid : item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    item.current
                      ? 'bg-gradient-to-r from-accent to-primary-300 text-white shadow-soft'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="p-2.5 text-gray-700 lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-accent to-primary-300 rounded-lg flex items-center justify-center">
                <HeartIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">SAFE Care</span>
            </div>

            <div className="flex items-center space-x-2">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-br from-accent to-primary-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;