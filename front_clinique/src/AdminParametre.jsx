import React, { useState } from 'react';
import './styles/AdminParametre.css';

const AdminParametre = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    appName: 'SoinLink',
    contactEmail: 'contact@soinlink.com',
    address: '123 Rue de la Santé, 75001 Paris, France',
    notifications: {
      newUser: true,
      newDoctor: true,
      activityReport: true
    },
    security: {
      require2FA: false,
      minPasswordLength: 8
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked
      }
    }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleSave = (section) => {
    console.log(`Sauvegarde des paramètres ${section}`, settings);
    alert(`Paramètres ${section} sauvegardés avec succès!`);
  };

  return (
    <div className="admin-parametre-container">
      <header className="admin-parametre-header">
        <h2>Paramètres</h2>
      </header>

      <div className="admin-parametre-content">

        <main className="admin-parametre-main">
          <div className="admin-parametre-header-section">
            <h2>Paramètres Généraux</h2>
            
            <div className="admin-parametre-tabs">
              <button 
                className={activeTab === 'general' ? 'active' : ''}
                onClick={() => setActiveTab('general')}
              >
                Général
              </button>
              <button 
                className={activeTab === 'notifications' ? 'active' : ''}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
              <button 
                className={activeTab === 'security' ? 'active' : ''}
                onClick={() => setActiveTab('security')}
              >
                Sécurité
              </button>
              <button 
                className={activeTab === 'integrations' ? 'active' : ''}
                onClick={() => setActiveTab('integrations')}
              >
                Intégrations
              </button>
            </div>
          </div>

          {activeTab === 'general' && (
            <div className="admin-parametre-section">
              <h3>Configuration de la Plateforme</h3>
              <p className="section-description">
                Gérez les informations de base de l'application SoinLink.
              </p>

              <div className="parametre-form">
                <div className="form-group">
                  <label htmlFor="appName">Nom de l'application</label>
                  <input
                    type="text"
                    id="appName"
                    name="appName"
                    value={settings.appName}
                    onChange={handleInputChange}
                    className="parametre-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactEmail">Email de contact principal</label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleInputChange}
                    className="parametre-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Adresse du siège</label>
                  <textarea
                    id="address"
                    name="address"
                    value={settings.address}
                    onChange={handleInputChange}
                    className="parametre-textarea"
                    rows="3"
                  />
                </div>

                <button 
                  className="parametre-save-button"
                  onClick={() => handleSave('généraux')}
                >
                  Sauvegarder les Paramètres
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="admin-parametre-section">
              <h3>Paramètres des Notifications Admin</h3>
              <p className="section-description">
                Choisissez les notifications par email que vous souhaitez recevoir.
              </p>

              <div className="parametre-notifications">
                <div className="notification-item">
                  <div className="notification-header">
                    <input
                      type="checkbox"
                      id="newUser"
                      name="newUser"
                      checked={settings.notifications.newUser}
                      onChange={handleCheckboxChange}
                      className="notification-checkbox"
                    />
                    <label htmlFor="newUser" className="notification-label">
                      Nouvel utilisateur inscrit
                    </label>
                  </div>
                  <p className="notification-description">
                    Recevoir une alerte à chaque nouvelle inscription.
                  </p>
                </div>

                <div className="notification-item">
                  <div className="notification-header">
                    <input
                      type="checkbox"
                      id="contacts"
                      name="contacts"
                      checked={true}
                      onChange={() => {}}
                      className="notification-checkbox"
                    />
                    <label htmlFor="contacts" className="notification-label">
                      Contacts urgents
                    </label>
                  </div>
                </div>

                <div className="notification-item">
                  <div className="notification-header">
                    <input
                      type="checkbox"
                      id="newDoctor"
                      name="newDoctor"
                      checked={settings.notifications.newDoctor}
                      onChange={handleCheckboxChange}
                      className="notification-checkbox"
                    />
                    <label htmlFor="newDoctor" className="notification-label">
                      Nouveau médecin à valider
                    </label>
                  </div>
                  <p className="notification-description">
                    Être notifié quand un médecin soumet son profil pour validation.
                  </p>
                </div>

                <div className="notification-item">
                  <div className="notification-header">
                    <input
                      type="checkbox"
                      id="activityReport"
                      name="activityReport"
                      checked={settings.notifications.activityReport}
                      onChange={handleCheckboxChange}
                      className="notification-checkbox"
                    />
                    <label htmlFor="activityReport" className="notification-label">
                      Rapport mensuel d'activités
                    </label>
                  </div>
                  <p className="notification-description">
                    Recevoir le rapport mensuel par email.
                  </p>
                </div>

                <button 
                  className="parametre-save-button"
                  onClick={() => handleSave('notifications')}
                >
                  Sauvegarder les Préférences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="admin-parametre-section">
              <h3>Sécurité et Accès</h3>
              <p className="section-description">
                Gérez les politiques de sécurité pour tous les utilisateurs.
              </p>

              <div className="parametre-security">
                <div className="security-item">
                  <div className="security-header">
                    <input
                      type="checkbox"
                      id="require2FA"
                      name="require2FA"
                      checked={settings.security.require2FA}
                      onChange={handleSecurityChange}
                      className="security-checkbox"
                    />
                    <label htmlFor="require2FA" className="security-label">
                      Exiger l'authentification à deux facteurs (2FA)
                    </label>
                  </div>
                  <p className="security-description">
                    Imposer le 2FA pour tous les comptes Docteur et Admin.
                  </p>
                </div>

                <div className="security-item">
                  <div className="security-header">
                    <label htmlFor="minPasswordLength" className="security-label">
                      Longueur minimale du mot de passe
                    </label>
                    <input
                      type="number"
                      id="minPasswordLength"
                      name="minPasswordLength"
                      value={settings.security.minPasswordLength}
                      onChange={handleSecurityChange}
                      className="security-input"
                      min="6"
                      max="20"
                    />
                  </div>
                  <p className="security-description">
                    Nombre de caractères minimum requis pour les mots de passe.
                  </p>
                </div>

                <button 
                  className="parametre-save-button"
                  onClick={() => handleSave('sécurité')}
                >
                  Appliquer les Paramètres de Sécurité
                </button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="admin-parametre-section">
              <h3>Intégrations</h3>
              <p className="section-description">
                Configurez les services tiers intégrés à la plateforme.
              </p>
              
              <div className="parametre-integrations">
                <div className="integration-item">
                  <h4>Services de Paiement</h4>
                  <p>Configurez les passerelles de paiement pour les services payants.</p>
                </div>
                
                <div className="integration-item">
                  <h4>API Santé</h4>
                  <p>Connectez-vous aux services de santé externes et aux dossiers médicaux.</p>
                </div>
                
                <div className="integration-item">
                  <h4>Services de Messagerie</h4>
                  <p>Configurez l'envoi d'emails et de SMS aux utilisateurs.</p>
                </div>
                
                <button className="parametre-save-button">
                  Sauvegarder les Configurations
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminParametre;