import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importez useNavigate
import './styles/PatientDetailModal.css';
import { X, User, Calendar, Phone, Mail, Home, History, Clipboard, Syringe, Stethoscope, ScrollText, FileText } from 'lucide-react';

function PatientDetailModal({ patient, onClose }) {
  if (!patient) return null;

  const navigate = useNavigate(); // Initialisez useNavigate

  // Nouvelle fonction pour gérer le téléchargement authentifié
  const handleDownload = async (filename) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Si pas de jeton, rediriger vers la page de connexion
      navigate('/connexion');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/download/exam-file/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Accept': 'application/pdf' // Optionnel, mais peut aider à indiquer le type attendu
        },
      });

      if (response.ok) {
        // Le téléchargement a réussi, créer un lien temporaire pour le fichier
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // Utilise le nom de fichier pour le téléchargement
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url); // Libère la ressource après le téléchargement
      } else if (response.status === 401) {
        // Jeton non valide ou expiré, rediriger
        alert("Votre session a expiré. Veuillez vous reconnecter.");
        navigate('/connexion');
      } else {
        const errorData = await response.json(); // Tenter de lire le message d'erreur du backend
        alert(errorData.message || 'Erreur lors du téléchargement du fichier.');
      }
    } catch (error) {
      //console.error('Erreur de téléchargement:', error);
      //alert('Une erreur inattendue est survenue lors du téléchargement.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Dossier de {patient.name}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="patient-details-sections">
          <div className="section-overview">
            <div className="patient-avatar-large">{patient.avatar}</div>
            <div className="patient-contact-info">
              <h3><User size={20} /> {patient.name}</h3>
              <p><Calendar size={16} /> {patient.age} ans, {patient.gender}</p>
              <p><Home size={16} /> {patient.address}</p>
              <p><Phone size={16} /> {patient.phone}</p>
              <p><Mail size={16} /> {patient.email}</p>
            </div>
          </div>

          <div className="section">
            <h3><History size={18} /> Antécédents Médicaux</h3>
            {(patient.medicalHistory && patient.medicalHistory.length > 0) ? (
              <ul>
                {patient.medicalHistory.map((entry, index) => (
                  <li key={index}>
                    <strong>{entry.year}:</strong> {entry.event}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun antécédent médical enregistré.</p>
            )}
          </div>

          <div className="section">
            <h3><Syringe size={18} /> Traitements en Cours</h3>
            {patient.medications ? (
              <p>{patient.medications}</p>
            ) : (
              <p>Aucun traitement en cours.</p>
            )}
          </div>

          <div className="section">
            <h3><Clipboard size={18} /> Notes Infirmières</h3>
            {patient.notes ? (
              <p>{patient.notes}</p>
            ) : (
              <p>Aucune note infirmière.</p>
            )}
          </div>

          <div className="section">
            <h3><ScrollText size={18} /> Résultat d'examen médical et Rapports</h3>
            {patient.patientExams && patient.patientExams.length > 0 ? (
                patient.patientExams.map((exam, index) => (
                    <p key={index}>
                        <FileText size={16} /> {exam.type} du {exam.date} (Résultat: {exam.result})
                        {exam.file && (
                            // Utilisez un bouton ou un span avec un onClick pour gérer le téléchargement
                            <span
                                className="download-link" // Gardez votre style existant
                                onClick={() => handleDownload(exam.file)} // Appelle la nouvelle fonction
                                style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }} // Ajoutez un style pour indiquer que c'est cliquable
                            >
                                Télécharger
                            </span>
                        )}
                    </p>
                ))
            ) : (
                <>
                    <p>
                        <FileText size={16} /> Aucun examen ou rapport enregistré.
                    </p>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDetailModal;