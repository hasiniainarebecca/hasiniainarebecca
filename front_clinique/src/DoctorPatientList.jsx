import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/DoctorPatientList.css';
import { Search, UserPlus, ListFilter, Eye, Users, Calendar, FileText } from 'lucide-react';

function DoctorPatientList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctorPatients = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/connexion');
          return;
        }

        const response = await axios.get('http://localhost:8000/api/doctors/patients', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        setPatients(response.data);
        console.log(response)
        
      } catch (error) {
        console.error('Failed to fetch doctor patients:', error);

        if (error.response) {
          if (error.response.status === 403) {
            setError('Accès refusé. Vous n\'êtes pas autorisé à voir cette liste de patients.');
          } else if (error.response.status === 404) {
            setError('La ressource demandée n\'a pas été trouvée (404). Vérifiez l\'URL du backend ou le serveur.');
          } else {
            setError(`Erreur HTTP: ${error.response.status} - ${error.response.data.message || 'Une erreur est survenue.'}`);
          }
        } else if (error.request) {
          setError('Impossible de joindre le serveur. Assurez-vous que le backend est en cours d\'exécution.');
        } else {
          setError('Erreur inattendue lors de la récupération des patients.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorPatients();
  }, [navigate]);

  const handleViewDetails = (patientId) => {
    navigate(`/dossier-patient-docteur/${patientId}`);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Actif': return 'mdpl-status-active';
      case 'Inactif': return 'mdpl-status-inactive';
      case 'En attente': return 'mdpl-status-pending';
      default: return '';
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistiques calculées
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'Actif').length;
  const pendingPatients = patients.filter(p => p.status === 'En attente').length;

  if (loading) {
    return (
            <div className="mdpl-loading-container">
              <div className="mdpl-loading-spinner"></div>
              <p className="mdpl-loading-text">Chargement des patients...</p>
            </div>
    );
  }

  if (error) {
    return (
            <div className="mdpl-error-container">
              <div className="mdpl-error-icon">⚠️</div>
              <h3 className="mdpl-error-title">Erreur de chargement</h3>
              <p className="mdpl-error-message">{error}</p>
            </div>
    );
  }

  return (
          <div className="mdpl-wrapper">
            {/* En-tête de la page */}
            <div className="mdpl-page-header">
              <div className="mdpl-page-title">
                <h1>Patients du Docteur</h1>
                <p className="mdpl-page-subtitle">Gérez et consultez les dossiers de vos patients</p>
              </div>
            </div>

            {/* Section principale avec tableau */}
            <div className="mdpl-main-card">
              <div className="mdpl-card-header">
                <h2 className="mdpl-card-title">Liste des Patients</h2>
                <div className="mdpl-search-container">
                  <div className="mdpl-search-wrapper">
                    <Search size={20} className="mdpl-search-icon" />
                    <input
                      type="text"
                      className="mdpl-search-input"
                      placeholder="Rechercher un patient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mdpl-card-content">
                {filteredPatients.length > 0 ? (
                  <div className="mdpl-table-wrapper">
                    <table className="mdpl-patients-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Âge</th>
                          <th>Sexe</th>
                          <th>Dernière Consultation</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.map(patient => (
                          <tr key={patient.id} className="mdpl-table-row">
                            <td className="mdpl-patient-cell">
                              <div className="mdpl-patient-info">
                                <div className="mdpl-patient-avatar">
                                  {patient.avatar}
                                </div>
                                <div className="mdpl-patient-details">
                                  <div className="mdpl-patient-name">{patient.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="mdpl-age-cell">{patient.age} ans</td>
                            <td className="mdpl-gender-cell">{patient.gender}</td>
                            <td className="mdpl-date-cell">{patient.lastConsultation}</td>
                            <td className="mdpl-status-cell">
                              <span className={`mdpl-status-badge ${getStatusClass(patient.status)}`}>
                                {patient.status}
                              </span>
                            </td>
                            <td className="mdpl-actions-cell">
                              <button
                                className="mdpl-view-button"
                                onClick={() => handleViewDetails(patient.id)}
                              >
                                <Eye size={16} />
                                <span>Voir Dossier</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mdpl-empty-state">
                    <div className="mdpl-empty-icon">
                      <Users size={48} />
                    </div>
                    <h3 className="mdpl-empty-title">Aucun patient trouvé</h3>
                    <p className="mdpl-empty-message">
                      {searchTerm 
                        ? "Aucun patient ne correspond à votre recherche." 
                        : "Vous n'avez pas encore de patients assignés."
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
  );
}

export default DoctorPatientList;