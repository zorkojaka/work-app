import React, { useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import UIConfigModal from '../admin/UIConfigModal';
import { useUIConfig } from '../../hooks/useUIConfig';
import { UserRole } from '../../types/config';

const Navigation: React.FC = () => {
    const { user } = useAuth();
    const { uiConfig, updateUIConfig } = useUIConfig();
    const [showUIConfig, setShowUIConfig] = useState(false);

    // Check if user has builder or admin role
    const canManageUI = user?.roles?.some((role: UserRole) => 
        role.permissions.canManageUI || role.permissions.canManageUsers
    );
    
    // Preveri, če je uporabnik vodja projektov
    const isProjectManager = user?.roles?.some((role: UserRole) => 
        role.name === 'project_manager' || role.permissions.canManageProjects
    );

    const handleConfigUpdate = (newConfig: typeof uiConfig) => {
        updateUIConfig(newConfig);
        setShowUIConfig(false);
    };

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            {/* Logo */}
                            <img
                                className="h-8 w-auto"
                                src="/logo.png"
                                alt="Logo"
                            />
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {/* Navigation buttons */}
                            <a
                                href="/projects"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Projects
                            </a>
                            <a
                                href="/clients"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Clients
                            </a>
                            {/* Povezava do strani za izvedbo projekta - vidna samo za vodje projektov */}
                            {isProjectManager && (
                                <a
                                    href="/projects"
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Izvedba projektov
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {/* Admin buttons */}
                        {canManageUI && (
                            <button
                                onClick={() => setShowUIConfig(true)}
                                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                            >
                                UI Config
                            </button>
                        )}
                        
                        {/* Uporabniški meni */}
                        <div className="ml-4 flex items-center">
                            <button className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                                <span className="sr-only">Open user menu</span>
                                <img
                                    className="h-8 w-8 rounded-full"
                                    src={user?.photoURL || 'https://via.placeholder.com/40'}
                                    alt={user?.displayName || 'User'}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* UI Config Modal */}
            {showUIConfig && (
                <UIConfigModal
                    config={uiConfig}
                    onSave={handleConfigUpdate}
                    onClose={() => setShowUIConfig(false)}
                />
            )}
        </nav>
    );
};

export default Navigation;
