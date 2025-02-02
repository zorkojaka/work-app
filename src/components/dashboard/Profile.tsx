import React from 'react';
import Header from '../common/Header';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { logout, roles } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Domov', onClick: () => navigate('/dashboard') },
    { label: 'Profil', onClick: () => navigate('/profile') },
    ...(roles.includes('Organizator')
      ? [{ label: 'Organizator', onClick: () => navigate('/projects') }]
      : []),
    { label: 'Odjava', onClick: logout },
  ];

  return (
    <div>
      <Header title="Profil" menuItems={menuItems} />
      {/* Preostala vsebina Profila */}
    </div>
  );
};
