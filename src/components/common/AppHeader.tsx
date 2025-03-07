import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import RoleSwitcher from './RoleSwitcher';
import {
  HomeIcon,
  UsersIcon,
  UserIcon,
  DocumentTextIcon,
  CogIcon,
  BriefcaseIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../hooks/useTheme';

// 1. Definicija tipov
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

// 2. Komponenta za AppHeader
const AppHeader: React.FC = () => {
  // 2.1 Stanje in hooki
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout, roles, activeRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // 2.2 Zapiranje menijev ob kliku izven
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#profile-menu') && !target.closest('#profile-button')) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 2.3 Zapiranje mobilnega menija ob spremembi poti
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // 2.4 Definicija navigacijskih elementov
  const navigation: NavItem[] = [
    { name: 'Nadzorna plošča', path: '/dashboard', icon: <HomeIcon className="w-6 h-6" />, roles: ['ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'INSTALLER', 'ACCOUNTANT', 'SALES'] },
    { name: 'Projekti', path: '/projects', icon: <DocumentTextIcon className="w-6 h-6" />, roles: ['ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'INSTALLER', 'SALES'] },
    { name: 'Izvedba projektov', path: '/project-execution', icon: <DocumentTextIcon className="w-6 h-6" />, roles: ['PROJECT_MANAGER'] },
    { name: 'Stranke', path: '/clients', icon: <BriefcaseIcon className="w-6 h-6" />, roles: ['ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'SALES'] },
    { name: 'Uporabniki', path: '/admin/users', icon: <UsersIcon className="w-6 h-6" />, roles: ['ADMIN'] },
  ];

  // 2.5 Filtriranje navigacije glede na vlogo
  const filteredNavigation = navigation.filter(item => item.roles.includes(activeRole));

  // 2.6 Upravljanje profilnega menija
  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  // 2.7 Odjava
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 3. Izris komponente
  return (
    <header className="bg-white shadow-md">
      {/* 3.1 Desktop navigacija */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 3.1.1 Logotip in glavni meni */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">WorkApp</span>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-4">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname.startsWith(item.path)
                      ? `text-white bg-[${theme.primary}]`
                      : 'text-gray-600 hover:text-white hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: location.pathname.startsWith(item.path) ? theme.primary : '',
                    color: location.pathname.startsWith(item.path) ? 'white' : ''
                  }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* 3.1.2 Desna stran - preklopnik vlog in profil */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="w-48">
              <RoleSwitcher />
            </div>
            <div className="relative">
              <button
                id="profile-button"
                onClick={handleProfileClick}
                className="flex items-center text-sm font-medium text-gray-700 rounded-full hover:text-blue-600 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <ChevronDownIcon className="ml-1 h-5 w-5" />
              </button>

              {/* 3.1.3 Profil meni */}
              {profileMenuOpen && (
                <div
                  id="profile-menu"
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                >
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Moj profil
                    </Link>
                    {(activeRole === 'DIRECTOR' || activeRole === 'ADMIN') && (
                      <>
                        <Link
                          to="/settings/company"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Nastavitve podjetja
                        </Link>
                        <Link
                          to="/settings/ui"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Nastavitve UI
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Odjava
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3.1.4 Mobilni meni gumb */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3.2 Mobilni meni */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  location.pathname.startsWith(item.path)
                    ? `text-white bg-[${theme.primary}]`
                    : 'text-gray-600 hover:text-white hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: location.pathname.startsWith(item.path) ? theme.primary : '',
                  color: location.pathname.startsWith(item.path) ? 'white' : ''
                }}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 py-2">
              <RoleSwitcher />
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-white hover:bg-gray-50"
              >
                <UserIcon className="mr-3 h-6 w-6" />
                Moj profil
              </Link>
              {(activeRole === 'DIRECTOR' || activeRole === 'ADMIN') && (
                <>
                  <Link
                    to="/settings/company"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-white hover:bg-gray-50"
                  >
                    <CogIcon className="mr-3 h-6 w-6" />
                    Nastavitve podjetja
                  </Link>
                  <Link
                    to="/settings/ui"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-white hover:bg-gray-50"
                  >
                    <CogIcon className="mr-3 h-6 w-6" />
                    Nastavitve UI
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-white hover:bg-gray-50"
              >
                <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" />
                Odjava
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
