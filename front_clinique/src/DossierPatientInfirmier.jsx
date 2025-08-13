import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/DossierPatientInfirmier.css';
import PatientDetailModal from './PatientDetailModal';
import { Search, User, FileText, Calendar, Clock, Users, Activity } from 'lucide-react';

function PatientRecordsInfirmier() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNursePatients = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/connexion');
          return;
        }

        const response = await fetch('http://localhost:8000/api/nurse/patients', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 403) {
            setError(errorData.message || 'Accès refusé. Vous n\'êtes pas autorisé à voir cette liste de patients.');
          } else {
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
        }

        const data = await response.json();
        setPatients(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch nurse patients:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNursePatients();
  }, [navigate]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = async (patient) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/connexion');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/nurse/patients/${patient.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          setError(errorData.message || 'Accès refusé. Vous n\'êtes pas autorisé à voir le dossier de ce patient.');
          alert(errorData.message || 'Accès refusé. Vous n\'êtes pas autorisé à voir le dossier de ce patient.');
        } else {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      setSelectedPatient(data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch detailed patient data for modal:", error);
      setError(error.message);
      alert(`Erreur lors du chargement des détails du patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedPatient(null);
  };

  if (loading && !selectedPatient) {
    return (
      <div className="patients-infirmier-loading-container">
        <div className="patients-infirmier-loading-spinner">
          <Activity className="patients-infirmier-spinner-icon" size={32} />
          <span>Chargement des patients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patients-infirmier-error-container">
        <div className="patients-infirmier-error-card">
          <h3>Erreur</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
          <div className="patients-infirmier-page">
            {/* Header Section */}
            <div className="patients-infirmier-header">
              <div className="patients-infirmier-header-content">
                <div className="patients-infirmier-title-section">
                  <h1 className="patients-infirmier-main-title">Dossiers des Patients</h1>
                  <p className="patients-infirmier-subtitle">Gérez et consultez les dossiers de vos patients</p>
                </div>
                <div className="patients-infirmier-stats-card">
                  <Users className="patients-infirmier-stats-icon" size={24} />
                  <div className="patients-infirmier-stats-content">
                    <span className="patients-infirmier-stats-number">{patients.length}</span>
                    <span className="patients-infirmier-stats-label">Patients suivis</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="patients-infirmier-search-section">
              <div className="patients-infirmier-search-container">
                <Search className="patients-infirmier-search-icon" size={20} />
                <input
                  type="text"
                  className="patients-infirmier-search-input"
                  placeholder="Rechercher un patient par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Patients Grid */}
            <div className="patients-infirmier-content">
              {filteredPatients.length > 0 ? (
                <div className="patients-infirmier-grid">
                  {filteredPatients.map(patient => (
                    <div 
                      key={patient.id} 
                      className="patients-infirmier-patient-card"
                      onClick={() => handleViewDetails(patient)}
                    >
                      <div className="patients-infirmier-card-header">
                        <div className="patients-infirmier-patient-avatar">
                          {patient.avatar}
                        </div>
                        <div className="patients-infirmier-patient-basic-info">
                          <h3 className="patients-infirmier-patient-name">{patient.name}</h3>
                          <span className="patients-infirmier-patient-id">ID: #{patient.id}</span>
                        </div>
                      </div>
                      
                      <div className="patients-infirmier-card-body">
                        <div className="patients-infirmier-info-item">
                          <Calendar className="patients-infirmier-info-icon" size={16} />
                          <span className="patients-infirmier-info-label">Dernière visite:</span>
                          <span className="patients-infirmier-info-value">{patient.lastVisit}</span>
                        </div>
                        <div className="patients-infirmier-info-item">
                          <Clock className="patients-infirmier-info-icon" size={16} />
                          <span className="patients-infirmier-info-label">Prochain RDV:</span>
                          <span className="patients-infirmier-info-value">{patient.nextAppointment}</span>
                        </div>
                      </div>

                      <div className="patients-infirmier-card-footer">
                        <button className="patients-infirmier-view-btn">
                          <FileText size={16} />
                          <span>Voir le dossier</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="patients-infirmier-empty-state">
                  <div className="patients-infirmier-empty-icon">
                    <User size={48} />
                  </div>
                  <h3 className="patients-infirmier-empty-title">Aucun patient trouvé</h3>
                  <p className="patients-infirmier-empty-text">
                    {searchTerm 
                      ? `Aucun patient ne correspond à "${searchTerm}"`
                      : "Vous n'avez pas encore de patients assignés"
                    }
                  </p>
                </div>
              )}
            </div>

            {selectedPatient && (
              <PatientDetailModal patient={selectedPatient} onClose={handleCloseModal} />
            )}
          </div>
  );
}

export default PatientRecordsInfirmier;