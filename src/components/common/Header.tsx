import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import RoleSwitcher from './RoleSwitcher';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, roles, activeRole } = useAuth();

  // Določimo, katere vloge imajo dostop do CRM-ja
  const canAccessCRM = ['ADMIN', 'DIRECTOR', 'PROJECT_MANAGER'].includes(activeRole);

  const headerMenuItems = [
    { label: 'Domov', onClick: () => navigate('/dashboard') },
    { label: 'Profil', onClick: () => navigate('/profile') },
    ...(canAccessCRM ? [{ label: 'Stranke', onClick: () => navigate('/clients') }] : []),
    { label: 'Odjava', onClick: logout },
    ...(activeRole === 'ADMIN' ? [{ label: 'Uporabniki', onClick: () => navigate('/admin/users') }] : []),
  ];

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleOutsideClick = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm p-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Leva stran - naslov */}
          <h1 className="text-xl font-semibold">{title}</h1>

          {/* Sredina - preklopnik vlog */}
          <div className="flex-1 max-w-xs mx-4">
            <RoleSwitcher />
          </div>

          {/* Desna stran - meni */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="p-2 bg-gray-200 rounded-full shadow hover:bg-gray-300"
            >
              <span className="material-icons">menu</span>
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50"
                onBlur={handleOutsideClick}
              >
                {headerMenuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setIsDropdownOpen(false);
                    }}
                    className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;