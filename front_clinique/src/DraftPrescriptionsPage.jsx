import { useState, useEffect } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom'
import { Search, Edit, Trash2, Calendar, Clock, FileText, Send } from 'lucide-react'
import './styles/DraftPrescriptionsPage.css'

function DraftPrescriptionsPage({ onEditDraft }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [draftPrescriptions, setDraftPrescriptions] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/prescriptions/brouillons', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
        });

        const formatted = response.data.map(prescription => ({
          id: prescription.id,
          patientName: `${prescription.patient.nom} ${prescription.patient.prenom}`,
          createdAt: new Date(prescription.created_at).toLocaleDateString(),
          lastModified: new Date(prescription.updated_at).toLocaleString(),
          medications: prescription.medications.map(med => ({
            name: med.medication_name,
            dosage: med.dosage,
            frequency: med.frequency || '-',
            duration: med.duration || '-',
          }))
        }));

        setDraftPrescriptions(formatted);
      } catch (error) {
        console.error("Erreur lors de la récupération des brouillons :", error);
      }
    };

    fetchDrafts();
  }, []);
  
  const handleSendPrescription = async (id) => {
    try {
      await axios.put(`http://localhost:8000/api/prescriptions/${id}/envoyer`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Ordonnance envoyée avec succès !");
      // Retirer l'ordonnance envoyée de la liste des brouillons
      setDraftPrescriptions(draftPrescriptions.filter(draft => draft.id !== id));
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'ordonnance :", error);
      alert("Une erreur s'est produite lors de l'envoi.");
    }
  };
  
  const handleDeleteDraft = async (id) => {
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer cette ordonnance ?");
    if (!confirmDelete) return;
  
    try {
      await axios.delete(`http://localhost:8000/api/prescriptions/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Ordonnance supprimer avec succès");
      // Mise à jour de l'état local
      setDraftPrescriptions(draftPrescriptions.filter(draft => draft.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression de l'ordonnance :", error);
      alert("Une erreur s'est produite lors de la suppression.");
    }
  };
  
  
  const filteredDrafts = draftPrescriptions.filter(draft => 
    draft.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.medications.some(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  return (
<div className="dashboard-doctor-main-content">
    <div className="draft-prescriptions-page">
      <div className="drafts-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Brouillons d'ordonnances</h1>
            <button 
              onClick={() => navigate('/docteur/prescription')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'backgroundColor 0.2s',
              }}
            >
              Prescrire des médicaments
            </button>
          </div>
      </div>
      
      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Rechercher l'ordonnance d'un patient ..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="drafts-count">
        {filteredDrafts.length} brouillon{filteredDrafts.length !== 1 ? 's' : ''} trouvé{filteredDrafts.length !== 1 ? 's' : ''}
      </div>
      
      <div className="drafts-list">
        {filteredDrafts.length > 0 ? (
          filteredDrafts.map(draft => (
            <div key={draft.id} className="draft-card">
              <div className="draft-header">
                <h2 className="patient-name">{draft.patientName}</h2>
                <div className="draft-actions">
                  <button 
                    className="action-button edit"
                    onClick={() => onEditDraft(draft.id)}
                  >
                    <Edit size={16} />
                    <span>Modifier</span>
                  </button>
                  <button 
                    className="action-button delete"
                    onClick={() => handleDeleteDraft(draft.id)}
                  >
                    <Trash2 size={16} />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
              
              <div className="draft-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Créé le {draft.createdAt}</span>
                </div>
                <div className="meta-item">
                  <Clock size={14} />
                  <span>Dernière modification: {draft.lastModified}</span>
                </div>
                <div className="meta-item">
                  <FileText size={14} />
                  <span>{draft.medications.length} médicament{draft.medications.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              <div className="medications-list">
                <h3>Médicaments prescrits</h3>
                <table className="medications-table">
                  <thead>
                    <tr>
                      <th>Médicament</th>
                      <th>Dosage</th>
                      <th>Fréquence</th>
                      <th>Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.medications.map((med, index) => (
                      <tr key={index}>
                        <td>{med.name}</td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency} par jour</td>
                        <td>pendant {med.duration} jours</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="draft-footer">
                <button className="send-button" onClick={() => handleSendPrescription(draft.id)}>
                  <Send size={16} />
                  <span>Envoyer l'ordonnance</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-drafts">
            <div className="no-drafts-icon">
              <FileText size={48} />
            </div>
            <h3>Aucun brouillon trouvé</h3>
            <p>Vous n'avez pas encore enregistré d'ordonnances comme brouillons ou aucun résultat ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

export default DraftPrescriptionsPage