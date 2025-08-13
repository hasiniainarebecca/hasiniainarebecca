import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Plus, Trash2, Send, Save } from 'lucide-react'
import './styles/EditDraftPrescriptionPage.css'

function EditDraftPrescriptionPage({ draftId, onBack }) {
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token') // ou autre méthode selon ton auth
  
    axios.get(`http://localhost:8000/api/drafts/${draftId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => {
        const data = res.data;
        console.log("Données reçues :", data);
      setDraft({
        ...data,
        medications: data.medications || [],
      })
      setLoading(false)
    })
    .catch(err => {
      console.error('Erreur lors du chargement du brouillon:', err)
      setLoading(false)
    })
  }, [draftId])
  
  
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
  })
  
  const [availableMedications, setAvailableMedications] = useState([
    { name: 'Amoxicilline', dosages: ['125mg', '250mg', '500mg', '1g'] },
    { name: 'Paracétamol', dosages: ['500mg', '1000mg'] },
    { name: 'Ibuprofène', dosages: ['200mg', '400mg', '600mg'] },
    { name: 'Vitamine D', dosages: ['1000 UI', '2000 UI'] },
    { name: 'Oméprazole', dosages: ['10mg', '20mg', '40mg'] }
  ])
  
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [availableDosages, setAvailableDosages] = useState([])
  
  useEffect(() => {
    if (selectedMedication) {
      const medication = availableMedications.find(med => med.name === selectedMedication)
      if (medication) {
        setAvailableDosages(medication.dosages)
      }
    } else {
      setAvailableDosages([])
    }
  }, [selectedMedication, availableMedications])
  
  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency && newMedication.duration) {
      setDraft({
        ...draft,
        medications: [
          ...draft.medications,
          {
            id: Date.now(), // Utilisation de timestamp comme ID temporaire
            ...newMedication
          }
        ],
        lastModified: new Date().toLocaleString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      })
      
      // Réinitialiser le formulaire
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
      })
      setSelectedMedication(null)
    }
  }
  
  const handleRemoveMedication = (medicationId) => {
    const token = localStorage.getItem('token'); // ou autre méthode selon ton auth
  
    // Supprimer localement le médicament de la liste
    setDraft({
      ...draft,
      medications: draft.medications.filter(med => med.id !== medicationId),
      lastModified: new Date().toLocaleString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    });
  
    // Appeler l'API pour supprimer le médicament dans la base de données
    axios.delete(`http://localhost:8000/api/prescriptions/${draft.id}/medications/${medicationId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(() => {
      console.log('Médicament supprimé avec succès');
    })
    .catch(err => {
      console.error('Erreur lors de la suppression du médicament:', err);
    });
  }
  
  
  const handleSaveDraft = () => {
    const confirmSave = window.confirm("Voulez-vous vraiment enregistrer les modifications ?");
    if (!confirmSave) return;
  
    const token = localStorage.getItem('token');
  
    // On construit un brouillon propre
    const payload = {
      notes: draft.pharmacistNotes,
      renewals: draft.renewals || 0,
      medications: draft.medications.map(med => ({
        medication_name: med.medication_name || med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
      }))
    }
    console.log("draft.renewals:", draft.renewals);
  
    console.log("Payload envoyé :", payload);
  
    axios.put(`http://localhost:8000/api/drafts/${draft.id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(() => {
      alert("Ordonnance modifiée avec succès !");
      if (onBack) onBack();
    })
    .catch(err => {
      console.error('Erreur lors de la mise à jour du brouillon:', err);
      alert("Une erreur est survenue lors de l'enregistrement.");
    });
  }
  
  

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  const handleSendPrescription = () => {
    // Dans un cas réel, vous enverriez l'ordonnance à une API
    console.log('Ordonnance envoyée:', draft)
    if (onBack) onBack()
  }
  
  
  return (
    <div className="with-sidebar">
            <div className="dashboard-container">
                <div className="main-content">
    <div className="edit-draft-page">
      <div className="edit-draft-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1>Modifier l'ordonnance</h1>
        
        
      </div>
      
      <div className="patient-info-card">
        <div className="patient-info">
        {draft && draft.patient && (
            <h2>Ordonnance pour {draft.patient.nom} {draft.patient.prenom}</h2>
        )}
        {draft && (
            <p className="patient-id">ID: {draft.patient.medical_id}</p>
        )}
        </div>
        {draft ? (
        <div className="draft-dates">
            <p>Créé le: {formatDate(draft.created_at)}</p>
            <p>Dernière modification: {formatDate(draft.updated_at)}</p>
        </div>
        ) : (
        <p>Chargement des dates...</p>
        )}
      </div>
      
      <div className="edit-section">
        <h3>Médicaments prescrits</h3>
        
        <div className="medications-table-container">
          <table className="medications-table">
            <thead>
              <tr>
                <th>Médicament</th>
                <th>Dosage</th>
                <th>Fréquence</th>
                <th>Durée</th>
                <th>Renouvellements</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {draft && draft.medications.map(med => (
                <tr key={med.id}>
                  <td>{med.medication_name || newMedication.name}</td>
                  <td>{med.dosage}</td>
                  <td>{med.frequency}</td>
                  <td>{med.duration}</td>
                  <td>{draft.renewals}</td>
                  <td>
                    <button 
                      className="remove-med-button"
                      onClick={() => handleRemoveMedication(med.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="add-medication-section">
        <h3>Ajouter un médicament</h3>
        
        <div className="add-medication-form">
          <div className="form-row">
            <div className="form-group">
              <label>Médicament</label>
              <select 
                value={selectedMedication || ''}
                onChange={(e) => {
                  setSelectedMedication(e.target.value)
                  setNewMedication({
                    ...newMedication,
                    name: e.target.value,
                    dosage: ''
                  })
                }}
              >
                <option value="">Sélectionner un médicament</option>
                {availableMedications.map(med => (
                  <option key={med.name} value={med.name}>{med.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Dosage</label>
              <select 
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                disabled={!selectedMedication}
              >
                <option value="">Sélectionner un dosage</option>
                {availableDosages.map(dosage => (
                  <option key={dosage} value={dosage}>{dosage}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Fréquence</label>
              <input 
                type="text" 
                placeholder="ex: 3 par jour"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Durée</label>
              <input 
                type="text" 
                placeholder="ex: 7 jours"
                value={newMedication.duration}
                onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
              />
            </div>
          </div>
          
          <div className="form-row">
            
            
            <div className="form-group add-button-container">
              <button 
                className="add-med-button"
                onClick={handleAddMedication}
                disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency || !newMedication.duration}
              >
                <Plus size={16} />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {draft && (
        <div className="pharmacist-notes-section">
          <div className="form-group">
          <label>Nombre total de renouvellements</label>
          <select 
            value={draft.renewals || 0}
            onChange={(e) => setDraft({ ...draft, renewals: parseInt(e.target.value) })}
          >
            {[0, 1, 2, 3, 4, 5].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
            <h3>Notes pour le pharmacien</h3>
            <textarea 
            placeholder="Ajouter des instructions spéciales pour le pharmacien..."
            value={draft.pharmacistNotes || ''}
            onChange={(e) => setDraft({...draft, pharmacistNotes: e.target.value})}
            ></textarea>
        </div>
        )}
            
      <div className="edit-draft-actions">
      <button className="back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Retour aux brouillons</span>
        </button>
        <button className="send-prescription-button" onClick={handleSaveDraft}>
          <Save size={16} />
          <span>Enregistrer les modifications</span>
        </button>
      </div>
    </div>
    </div></div></div>
  )
}

export default EditDraftPrescriptionPage