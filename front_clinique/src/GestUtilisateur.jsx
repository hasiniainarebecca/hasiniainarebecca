import React, { useState } from 'react';
import { Bell, User, Users, Search, Eye, Pause, Trash2, MoreHorizontal } from 'lucide-react';
import './styles/GestUtilisateur.css';

const GestUtilisateur = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous les rôles');
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  // Données d'exemple des utilisateurs
  const users = [
    {
      id: 1,
      name: 'Alice Dubois',
      email: 'alice.dubois@email.com',
      role: 'Patient',
      status: 'Actif',
      avatar: null
    },
    {
      id: 2,
      name: 'Bob Courtois',
      email: 'bob.courtois@email.com',
      role: 'Patient',
      status: 'Actif',
      avatar: null
    },
    {
      id: 3,
      name: 'Chloé Durand',
      email: 'chloe.durand@email.com',
      role: 'Patient',
      status: 'Actif',
      avatar: null
    }
  ];

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
  };

  const toggleActionsMenu = (userId) => {
    setShowActionsMenu(showActionsMenu === userId ? null : userId);
  };

  const handleViewProfile = (user) => {
    console.log('Voir le profil de:', user.name);
    setShowActionsMenu(null);
  };

  const handleSuspendUser = (user) => {
    console.log('Suspendre:', user.name);
    setShowActionsMenu(null);
  };

  const handleDeleteUser = (user) => {
    console.log('Supprimer:', user.name);
    setShowActionsMenu(null);
  };

  // Filtrer les utilisateurs selon les critères
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'Tous les rôles' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="gest-utilisateur">
      
      <div className="gest-utilisateur__main">
        <header className="gest-utilisateur__header">
          <h1>Gestion des Utilisateurs</h1>
          <div className="gest-utilisateur__header-actions">
            {/* <button className="gest-utilisateur__notification-btn">
              <Bell size={30} />
            </button>
            <div className="gest-utilisateur__profile-menu">
              <User size={20} />
            </div> */}
          </div>
        </header>

        <div className="gest-utilisateur__content">
          <div className="gest-utilisateur__section-header">
            <div className="gest-utilisateur__section-title">
              <span className="gest-utilisateur__section-icon">
                <Users size={20} />
              </span>
              <h2>Liste des Utilisateurs ({filteredUsers.length})</h2>
            </div>
            <p className="gest-utilisateur__section-description">
              Recherchez, filtrez et gérez tous les comptes de la plateforme.
            </p>
          </div>

          <div className="gest-utilisateur__filters">
            <div className="gest-utilisateur__search-container">
              <label htmlFor="search">Rechercher par nom</label>
              <div className="gest-utilisateur__search-input-wrapper">
                <input
                  id="search"
                  type="text"
                  placeholder="Nom de l'utilisateur..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="gest-utilisateur__search-input"
                />
                <span className="gest-utilisateur__search-icon">
                  <Search size={16} />
                </span>
              </div>
            </div>

            <div className="gest-utilisateur__filter-container">
              <label htmlFor="roleFilter">Filtrer par rôle</label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={handleRoleFilter}
                className="gest-utilisateur__filter-select"
              >
                <option>Tous les rôles</option>
                <option>Patient</option>
                <option>Médecin</option>
                <option>Admin</option>
              </select>
            </div>
          </div>

          <div className="gest-utilisateur__table-container">
            <table className="gest-utilisateur__table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="gest-utilisateur__user-info">
                        <div className="gest-utilisateur__user-avatar-small">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                          ) : (
                            <span>{user.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="gest-utilisateur__user-details">
                          <div className="gest-utilisateur__user-name">{user.name}</div>
                          <div className="gest-utilisateur__user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="gest-utilisateur__role-badge">{user.role}</span>
                    </td>
                    <td>
                      <span className="gest-utilisateur__status-badge gest-utilisateur__status-badge--active">
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="gest-utilisateur__actions">
                        <button
                          className="gest-utilisateur__actions-btn"
                          onClick={() => toggleActionsMenu(user.id)}
                        >
                          ...
                        </button>
                        {showActionsMenu === user.id && (
                          <div className="gest-utilisateur__actions-menu">
                            <div className="gest-utilisateur__actions-menu-header">Actions</div>
                            <button
                              className="gest-utilisateur__actions-menu-item"
                              onClick={() => handleViewProfile(user)}
                            >
                              <span className="gest-utilisateur__actions-menu-icon">
                                <Eye size={16} />
                              </span>
                              Voir le Profil
                            </button>
                            <button
                              className="gest-utilisateur__actions-menu-item"
                              onClick={() => handleSuspendUser(user)}
                            >
                              <span className="gest-utilisateur__actions-menu-icon">
                                <Pause size={16} />
                              </span>
                              Suspendre
                            </button>
                            <button
                              className="gest-utilisateur__actions-menu-item gest-utilisateur__actions-menu-item--danger"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <span className="gest-utilisateur__actions-menu-icon">
                                <Trash2 size={16} />
                              </span>
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestUtilisateur;