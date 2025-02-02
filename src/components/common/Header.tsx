import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

interface HeaderProps {
  title: string;
  menuItems: { label: string; onClick: () => void }[];
}

const Header: React.FC<HeaderProps> = ({ title, menuItems }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useAuth(); // Uporabimo, če potrebujemo podatke o uporabniku
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleOutsideClick = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center relative">
      {/* Naslov */}
      <h1 className="text-xl font-semibold">{title}</h1>

      {/* Dropdown meni */}
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="p-2 bg-gray-200 rounded-full shadow hover:bg-gray-300"
        >
          <span className="material-icons">menu</span> {/* Ikona menija */}
        </button>

        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg"
            onBlur={handleOutsideClick}
          >
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsDropdownOpen(false); // Zapri meni ob kliku
                }}
                className="block px-4 py-2 w-full text-left hover:bg-gray-100"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
