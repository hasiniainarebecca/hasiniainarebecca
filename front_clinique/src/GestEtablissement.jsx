import React, { useState } from 'react';
import { Calendar, Search, Plus, MoreHorizontal } from 'lucide-react';
import './styles/GestEtablissement.css';

const GestEtablissement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous les types');

  // Données d'exemple des établissements
  const etablissements = [
    {
      id: 1,
      nom: 'Hôpital Central de Paris',
      adresse: '1 Place du Parvis, 75004 Paris',
      type: 'Hôpital',
      contact: '0142771122',
      statut: 'Actif'
    },
    {
      id: 2,
      nom: 'Clinique de la Vision Lyon',
      adresse: '22 Rue de la République, 69002 Lyon',
      type: 'Clinique',
      contact: '0472415030',
      statut: 'Actif'
    },
    {
      id: 3,
      nom: 'Cabinet Médical des Vignes',
      adresse: '15 Rue des Vignerons, 33000 Bordeaux',
      type: 'Cabinet Médical',
      contact: '0556909090',
      statut: 'Inactif'
    },
    {
      id: 4,
      nom: 'Laboratoire Bio-Analyse Sud',
      adresse: '50 Avenue du Prado, 13008 Marseille',
      type: 'Laboratoire',
      contact: '0491775566',
      statut: 'Actif'
    }
  ];

  const typeOptions = ['Tous les types', 'Hôpital', 'Clinique', 'Cabinet Médical', 'Laboratoire'];

  // Filtrage des établissements
  const filteredEtablissements = etablissements.filter(etab => {
    const matchesSearch = etab.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Tous les types' || etab.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddEtablissement = () => {
    console.log('Ajouter un établissement');
  };

  const handleActionClick = (action, etablissement) => {
    console.log(`${action} pour ${etablissement.nom}`);
  };

  return (
    <div className="gest-etablissement-container">
      {/* Sidebar */}
      

      {/* Main Content */}
      <div className="gest-etablissement-main">
        <div className="gest-etablissement-header">
          <h1>Gestion des Établissements</h1>
          <button 
            className="gest-etablissement-add-btn"
            onClick={handleAddEtablissement}
          >
            <span className="gest-etablissement-plus-icon">
              <Plus size={16} />
            </span>
            Ajouter un Établissement
          </button>
        </div>

        <div className="gest-etablissement-content">
          <div className="gest-etablissement-list-header">
            <div className="gest-etablissement-list-title">
              <span className="gest-etablissement-calendar-icon">
                <Calendar size={20} />
              </span>
              <h2>Liste des Établissements ({filteredEtablissements.length})</h2>
            </div>
            <p className="gest-etablissement-subtitle">
              Recherchez, filtrez et gérez les établissements de santé partenaires.
            </p>
          </div>

          {/* Filters */}
          <div className="gest-etablissement-filters">
            <div className="gest-etablissement-search-group">
              <label>Rechercher par nom</label>
              <div className="gest-etablissement-search-input">
                <input
                  type="text"
                  placeholder="Nom de l'établissement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="gest-etablissement-search-icon">
                  <Search size={16} />
                </span>
              </div>
            </div>

            <div className="gest-etablissement-filter-group">
              <label>Filtrer par type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="gest-etablissement-type-select"
              >
                {typeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="gest-etablissement-table-container">
            <table className="gest-etablissement-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEtablissements.map(etablissement => (
                  <tr key={etablissement.id}>
                    <td>
                      <div className="gest-etablissement-name-cell">
                        <div className="gest-etablissement-name">{etablissement.nom}</div>
                        <div className="gest-etablissement-address">{etablissement.adresse}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`gest-etablissement-type-badge gest-etablissement-type-${etablissement.type.toLowerCase().replace(' ', '-')}`}>
                        {etablissement.type}
                      </span>
                    </td>
                    <td className="gest-etablissement-contact">{etablissement.contact}</td>
                    <td>
                      <span className={`gest-etablissement-status-badge gest-etablissement-status-${etablissement.statut.toLowerCase()}`}>
                        {etablissement.statut}
                      </span>
                    </td>
                    <td>
                      <div className="gest-etablissement-actions">
                        <button 
                          className="gest-etablissement-action-btn"
                          onClick={() => handleActionClick('menu', etablissement)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
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

export default GestEtablissement;