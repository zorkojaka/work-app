// components/settings/CompanySettings.tsx
import React, { useState, useEffect } from 'react';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChromePicker, ColorResult } from 'react-color';
import { useAuth } from '../../components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { CompanySettings as CompanySettingsType } from '../../types/companySettings';
import BreakSettings from './BreakSettings';
import UserBreakSettings from './UserBreakSettings';
import Header from '../common/Header';

// 1. KOMPONENTA ZA NASTAVITVE PODJETJA
const CompanySettings: React.FC = () => {
  // 1.1 Stanje in hooki
  const { settings, loading, error, updateSettings } = useCompanySettings();
  const [formData, setFormData] = useState<CompanySettingsType | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showColorPicker, setShowColorPicker] = useState<'primary' | 'secondary' | 'accent' | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'breaks' | 'users'>('general');
  const storage = getStorage();
  const { activeRole } = useAuth();

  // 1.3 Nastavitev začetnih vrednosti obrazca
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setLogoPreview(settings.logoUrl);
    }
  }, [settings]);

  // 1.4 Obravnava sprememb vnosnih polj
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Obravnava gnezdenih objektov (npr. colors.primary)
    if (name.includes('.') && formData) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as Record<string, any>,
          [child]: value
        }
      });
    } else if (formData) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // 1.5 Obravnava spremembe barve
  const handleColorChange = (color: any, colorType: 'primary' | 'secondary' | 'accent') => {
    if (formData) {
      setFormData({
        ...formData,
        colors: {
          ...formData.colors,
          [colorType]: color.hex
        }
      });
    }
  };

  // 1.6 Obravnava spremembe logotipa
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Prikaz predogleda
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 1.7 Nalaganje logotipa v Firebase Storage
  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) return formData?.logoUrl || '';
    
    const logoRef = ref(storage, `logos/${Date.now()}_${logoFile.name}`);
    await uploadBytes(logoRef, logoFile);
    const downloadUrl = await getDownloadURL(logoRef);
    return downloadUrl;
  };

  // 1.8 Shranjevanje nastavitev
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setSaveStatus('saving');
    
    try {
      // Če je bil izbran nov logotip, ga najprej naložimo
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }
      
      // Posodobimo nastavitve
      const success = await updateSettings({
        ...formData,
        logoUrl
      });
      
      if (success) {
        setSaveStatus('success');
        // Ponastavimo stanje po 3 sekundah
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Napaka pri shranjevanju nastavitev:', err);
      setSaveStatus('error');
    }
  };

  // 1.2 Preverjanje pravic dostopa
  if (activeRole !== 'DIRECTOR' && activeRole !== 'ADMIN') {
    return <Navigate to="/dashboard" />;
  }

  // 1.9 Prikaz stanja nalaganja
  if (loading && !formData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 1.10 Prikaz napake
  if (error && !formData) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Napaka!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // 2. IZRIS KOMPONENTE
  return (
    <div>
      <Header title="Nastavitve podjetja" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Nastavitve podjetja</h1>
        
        {formData && (
          <div className="flex flex-col space-y-6">
            {/* 2.1 Zavihki */}
            <div className="flex space-x-4">
              <button
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  activeTab === 'general' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('general')}
              >
                Splošne nastavitve
              </button>
              <button
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  activeTab === 'breaks' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('breaks')}
              >
                Nastavitve odmorov
              </button>
              <button
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  activeTab === 'users' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('users')}
              >
                Uporabniki
              </button>
            </div>
            
            {/* 2.2 Vsebina zavihkov */}
            {activeTab === 'general' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 2.1 Osnovni podatki */}
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Osnovni podatki</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Naziv podjetja</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-pošta</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefon</label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">Spletna stran</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 2.2 Naslov */}
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Naslov</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">Ulica in hišna številka</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Poštna številka</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">Mesto</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">Država</label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 2.3 Davčni podatki */}
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Davčni podatki</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700">Davčna številka</label>
                      <input
                        type="text"
                        id="taxNumber"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">Matična številka</label>
                      <input
                        type="text"
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 2.4 Logotip */}
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Logotip</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="logo" className="block text-sm font-medium text-gray-700">Logotip podjetja</label>
                      <input
                        type="file"
                        id="logo"
                        name="logo"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="mt-1 block w-full text-gray-700"
                      />
                      <p className="mt-1 text-sm text-gray-500">Priporočena velikost: 200x200 px, format PNG ali JPG</p>
                    </div>
                    
                    <div className="flex justify-center items-center">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logotip podjetja" 
                          className="max-h-32 max-w-full object-contain border rounded p-2" 
                        />
                      ) : (
                        <div className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                          <span className="text-gray-500">Ni logotipa</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 2.5 Barve */}
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Barve aplikacije</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Primarna barva</label>
                      <div className="mt-1 flex items-center">
                        <div 
                          className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                          style={{ backgroundColor: formData.colors.primary }}
                          onClick={() => setShowColorPicker(showColorPicker === 'primary' ? null : 'primary')}
                        ></div>
                        <input
                          type="text"
                          value={formData.colors.primary}
                          onChange={(e) => handleInputChange({ target: { name: 'colors.primary', value: e.target.value } } as any)}
                          className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      {showColorPicker === 'primary' && (
                        <div className="absolute z-10 mt-2">
                          <div className="fixed inset-0" onClick={() => setShowColorPicker(null)}></div>
                          <ChromePicker 
                            color={formData.colors.primary} 
                            onChange={(color) => handleColorChange(color, 'primary')} 
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sekundarna barva</label>
                      <div className="mt-1 flex items-center">
                        <div 
                          className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                          style={{ backgroundColor: formData.colors.secondary }}
                          onClick={() => setShowColorPicker(showColorPicker === 'secondary' ? null : 'secondary')}
                        ></div>
                        <input
                          type="text"
                          value={formData.colors.secondary}
                          onChange={(e) => handleInputChange({ target: { name: 'colors.secondary', value: e.target.value } } as any)}
                          className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      {showColorPicker === 'secondary' && (
                        <div className="absolute z-10 mt-2">
                          <div className="fixed inset-0" onClick={() => setShowColorPicker(null)}></div>
                          <ChromePicker 
                            color={formData.colors.secondary} 
                            onChange={(color) => handleColorChange(color, 'secondary')} 
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Poudarjena barva</label>
                      <div className="mt-1 flex items-center">
                        <div 
                          className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                          style={{ backgroundColor: formData.colors.accent }}
                          onClick={() => setShowColorPicker(showColorPicker === 'accent' ? null : 'accent')}
                        ></div>
                        <input
                          type="text"
                          value={formData.colors.accent}
                          onChange={(e) => handleInputChange({ target: { name: 'colors.accent', value: e.target.value } } as any)}
                          className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      {showColorPicker === 'accent' && (
                        <div className="absolute z-10 mt-2">
                          <div className="fixed inset-0" onClick={() => setShowColorPicker(null)}></div>
                          <ChromePicker 
                            color={formData.colors.accent} 
                            onChange={(color) => handleColorChange(color, 'accent')} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Predogled barv</h3>
                    <div className="flex space-x-2">
                      <div 
                        className="h-10 flex-1 rounded-md flex items-center justify-center text-white"
                        style={{ backgroundColor: formData.colors.primary }}
                      >
                        Primarna
                      </div>
                      <div 
                        className="h-10 flex-1 rounded-md flex items-center justify-center text-white"
                        style={{ backgroundColor: formData.colors.secondary }}
                      >
                        Sekundarna
                      </div>
                      <div 
                        className="h-10 flex-1 rounded-md flex items-center justify-center text-white"
                        style={{ backgroundColor: formData.colors.accent }}
                      >
                        Poudarjena
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 2.6 Gumbi za shranjevanje */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setFormData(settings)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ponastavi
                  </button>
                  <button
                    type="submit"
                    disabled={saveStatus === 'saving'}
                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      saveStatus === 'saving' 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : saveStatus === 'success' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : saveStatus === 'error' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {saveStatus === 'saving' 
                      ? 'Shranjevanje...' 
                      : saveStatus === 'success' 
                        ? 'Shranjeno!' 
                        : saveStatus === 'error' 
                          ? 'Napaka pri shranjevanju' 
                          : 'Shrani nastavitve'}
                  </button>
                </div>
              </form>
            )}
            
            {activeTab === 'breaks' && (
              <BreakSettings />
            )}
            
            {activeTab === 'users' && (
              <UserBreakSettings />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettings;
