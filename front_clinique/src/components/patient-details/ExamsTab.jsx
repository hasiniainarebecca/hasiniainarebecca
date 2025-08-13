// src/components/patient-details/ExamsTab.jsx
import React from 'react';
import { FlaskConical, Calendar, File, Download, AlertCircle, XCircle } from 'lucide-react';

function ExamsTab({ exams }) {
  if (!exams || exams.length === 0) {
    return (
      <div className="dpd-no-data-message">
        <FlaskConical size={48} />
        <p>Aucun examen enregistré pour ce patient.</p>
      </div>
    );
  }

  const handleDownloadFile = async (rawFileName) => {
    if (!rawFileName) {
      alert("Nom de fichier non disponible.");
      return;
    }

    // Extract the actual filename by removing "C:/fakepath/" if it exists
    const fileName = rawFileName.split('/').pop().split('\\').pop();

    try {
      const apiUrl = `${import.meta.env.VITE_BACKEND_URL}download/exam-file/${fileName}`;
      const token = localStorage.getItem('token');

      // --- CRITICAL DEBUGGING STEP ---
      console.log('Authentication Token:', token); 
      if (!token) {
        alert("Vous n'êtes pas authentifié ou votre session a expiré. Veuillez vous connecter à nouveau.");
        // Optionally redirect to login page
        // window.location.href = '/login'; 
        return;
      }
      // --- END CRITICAL DEBUGGING STEP ---

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/pdf', // Still remove this line as previously advised
        },
      });

      if (!response.ok) {
        let errorMessage = `Erreur de téléchargement: ${response.status}`;

        // Attempt to parse as JSON first (for API errors)
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error("Server response was not valid JSON. Response status:", response.status, "URL:", response.url);
          if (response.status === 405 && response.url.includes('/connexion')) {
              errorMessage = "Accès non autorisé ou session expirée. Redirection vers la page de connexion.";
          } else {
              errorMessage = `Erreur inattendue du serveur: ${response.status}. Veuillez vérifier la console pour plus de détails.`;
          }
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      // console.error('Erreur lors du téléchargement du fichier:', error);
      // alert(`Échec du téléchargement du fichier: ${error.message}`);
    }
  };

  return (
    <div>
      <h3 className="dpd-section-header">
        <FlaskConical size={24} /> Examens
      </h3>
      <table className="dpd-tab-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type d'Examen</th>
            <th>Résultat Principal</th>
            <th>Fichier</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exams.map(exam => (
            <tr key={exam.id}>
              <td><Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> {exam.date}</td>
              <td>{exam.type}</td>
              <td>{exam.result}</td>
              <td>
                {exam.file ? (
                  <a href="#" onClick={(e) => { e.preventDefault(); handleDownloadFile(exam.file); }}>
                    <File size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> {exam.file.split('/').pop().split('\\').pop()}
                  </a>
                ) : 'N/A'}
              </td>
              <td>
                {exam.file ? (
                  <button
                    className="dpd-action-button-sm dpd-download"
                    onClick={() => handleDownloadFile(exam.file)}
                  >
                    <Download size={16} /> Télécharger
                  </button>
                ) : (
                  <span className="text-muted"><XCircle size={16} style={{ verticalAlign: 'middle' }} /> Non disponible</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExamsTab;