import React, { useState } from 'react';
import { Link, Plus, Search, MoreHorizontal } from 'lucide-react';
import './styles/GestPharmacie.css';

const GestPharmacie = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pharmacies, setPharmacies] = useState([
    {
      id: 1,
      nom: 'Grande Pharmacie de Paris',
      adresse: '150 Rue de Rivoli, 75001 Paris',
      contact: '0145889900',
      statut: 'Actif'
    },
    {
      id: 2,
      nom: 'Pharmacie de la Croix-Rousse',
      adresse: '3 Boulevard de la Croix-Rousse, 69004 Lyon',
      contact: '0478281122',
      statut: 'Actif'
    },
    {
      id: 3,
      nom: 'Pharmacie du Port',
      adresse: '25 Quai Richelieu, 33000 Bordeaux',
      contact: '0556795344',
      statut: 'Inactif'
    },
    {
      id: 4,
      nom: 'Pharmacie de la Plage',
      adresse: '125 Corniche Président John Fitzgerald Kennedy, 13007 Marseille',
      contact: '0491528877',
      statut: 'Actif'
    }
  ]);

  const filteredPharmacies = pharmacies.filter(pharmacie =>
    pharmacie.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (id, newStatus) => {
    setPharmacies(pharmacies.map(pharmacie =>
      pharmacie.id === id ? { ...pharmacie, statut: newStatus } : pharmacie
    ));
  };

  return (
    <div className="gest-pharmacie-container">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="gest-pharmacie-main">
        {/* Header */}
        <div className="gest-pharmacie-header">
          <div className="gest-pharmacie-header-left">
            <h1 className="gest-pharmacie-title">Gestion des Pharmacies</h1>
          </div>
          {/* <div className="gest-pharmacie-header-right">
            <div className="gest-pharmacie-notification-badge">
              <span className="gest-pharmacie-notification-count">1</span>
            </div>
            <div className="gest-pharmacie-user-avatar">N</div>
          </div> */}
        </div>

        {/* Content */}
        <div className="gest-pharmacie-content">
          <div className="gest-pharmacie-card">
            <div className="gest-pharmacie-card-header">
              <div className="gest-pharmacie-card-title-section">
                <span className="gest-pharmacie-chain-icon">
                  <Link size={20} />
                </span>
                <h2 className="gest-pharmacie-card-title">
                  Liste des Pharmacies Partenaires ({filteredPharmacies.length})
                </h2>
              </div>
              <button className="gest-pharmacie-add-btn">
                <span className="gest-pharmacie-add-icon">
                  <Plus size={16} />
                </span>
                Ajouter une Pharmacie
              </button>
            </div>

            <p className="gest-pharmacie-description">
              Recherchez et gérez les pharmacies partenaires pour la commande de médicaments.
            </p>

            {/* Search */}
            <div className="gest-pharmacie-search-section">
              <div className="gest-pharmacie-search-label">Rechercher par nom</div>
              <div className="gest-pharmacie-search-container">
                <input
                  type="text"
                  placeholder="Nom de la pharmacie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="gest-pharmacie-search-input"
                />
                <button className="gest-pharmacie-search-btn">
                  <Search size={16} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="gest-pharmacie-table-container">
              <table className="gest-pharmacie-table">
                <thead>
                  <tr className="gest-pharmacie-table-header">
                    <th className="gest-pharmacie-table-th">Nom</th>
                    <th className="gest-pharmacie-table-th">Adresse</th>
                    <th className="gest-pharmacie-table-th">Contact</th>
                    <th className="gest-pharmacie-table-th">Statut</th>
                    <th className="gest-pharmacie-table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPharmacies.map((pharmacie) => (
                    <tr key={pharmacie.id} className="gest-pharmacie-table-row">
                      <td className="gest-pharmacie-table-td gest-pharmacie-table-name">
                        {pharmacie.nom}
                      </td>
                      <td className="gest-pharmacie-table-td">
                        {pharmacie.adresse}
                      </td>
                      <td className="gest-pharmacie-table-td">
                        {pharmacie.contact}
                      </td>
                      <td className="gest-pharmacie-table-td">
                        <span className={`gest-pharmacie-status-badge ${
                          pharmacie.statut === 'Actif' 
                            ? 'gest-pharmacie-status-active' 
                            : 'gest-pharmacie-status-inactive'
                        }`}>
                          {pharmacie.statut}
                        </span>
                      </td>
                      <td className="gest-pharmacie-table-td">
                        <button className="gest-pharmacie-actions-btn">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestPharmacie;