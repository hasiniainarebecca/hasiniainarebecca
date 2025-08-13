import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/EditPatientProfile.css';
import {
  User, Cake, MapPin, Phone, Mail, Droplet,
  Syringe, Stethoscope, BriefcaseMedical, Save, XCircle, Info, Edit, Pill, HeartPulse
} from 'lucide-react';
import { PlusCircle, MinusCircle } from 'lucide-react';

function EditPatientProfile() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '', // This will hold the 'yyyy-MM-dd' format for the input
    gender: '',
    address: '',
    phone: '',
    email: '',
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
    medicalHistory: [],
    exams: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({}); // État pour stocker les objets File réels pour l'upload

  useEffect(() => {
    const fetchPatientProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/connexion');
          return;
        }

        const response = await fetch('http://localhost:8000/api/patient/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/connexion');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Patient profile fetched:", data);

        // Formater la date de naissance pour l'input type="date" (YYYY-MM-DD)
        const formattedDateOfBirth = data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().split('T')[0]
          : '';

        // Formater les dates des examens pour l'input type="date" (YYYY-MM-DD)
        const formattedExams = data.exams.map(exam => {
          let formattedDate = '';
          if (exam.date) {
            // Le backend renvoie JJ/MM/AAAA, convertissons en AAAA-MM-JJ
            let dateParts = exam.date.split('/');
            if (dateParts.length === 3) {
                // Assurez-vous que les parties sont dans le bon ordre (Année, Mois-1, Jour)
                formattedDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]).toISOString().split('T')[0];
            } else {
                // Si le format n'est pas JJ/MM/AAAA, essayez de parser directement (peut être déjà YYYY-MM-DD)
                formattedDate = new Date(exam.date).toISOString().split('T')[0];
            }
          }
          return {
            ...exam,
            date: formattedDate // La date dans l'état sera maintenant YYYY-MM-DD
          };
        });

        setPatient({
          ...data, // Les données sont maintenant directes, sans la clé 'patient'
          dateOfBirth: formattedDateOfBirth,
          medicalHistory: data.medicalHistory || [], // Assurez-vous que la clé correspond à celle du backend
          exams: formattedExams || [],
        });
      } catch (err) {
        console.error("Erreur lors du chargement du profil:", err);
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatient(prevPatient => ({
      ...prevPatient,
      [name]: value,
    }));
    setFormErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleMedicalHistoryChange = (index, e) => {
    const { name, value } = e.target;
    setPatient(prevPatient => {
      const newHistory = [...prevPatient.medicalHistory];
      newHistory[index] = {
        ...newHistory[index],
        [name]: value,
      };
      return { ...prevPatient, medicalHistory: newHistory };
    });
    setFormErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      delete newErrors[`medicalHistory.${index}.${name}`];
      return newErrors;
    });
  };

  const handleAddMedicalHistory = () => {
    setPatient(prevPatient => ({
      ...prevPatient,
      medicalHistory: [...prevPatient.medicalHistory, { year: '', event: '', id: null }],
    }));
  };

  const handleRemoveMedicalHistory = (index) => {
    setPatient(prevPatient => ({
      ...prevPatient,
      medicalHistory: prevPatient.medicalHistory.filter((_, i) => i !== index),
    }));
    setFormErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`medicalHistory.${index}.`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const handleExamChange = (index, e) => {
    const { name, value } = e.target;
    setPatient(prevPatient => {
      const newExams = [...prevPatient.exams];
      // Pour l'input type="date", la valeur est déjà au format YYYY-MM-DD
      newExams[index] = {
        ...newExams[index],
        [name]: value,
      };
      return { ...prevPatient, exams: newExams };
    });
    setFormErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      delete newErrors[`exams.${index}.${name}`];
      return newErrors;
    });
  };

  const handleExamFileChange = (index, e) => {
    const file = e.target.files[0];
    setSelectedFiles(prevFiles => ({
      ...prevFiles,
      [index]: file, // Stocke l'objet File réel pour l'upload
    }));

    setPatient(prevPatient => {
      const newExams = [...prevPatient.exams];
      newExams[index] = {
        ...newExams[index],
        file: file ? file.name : '', // Met à jour le nom du fichier dans l'état pour l'affichage
      };
      return { ...prevPatient, exams: newExams };
    });
  };

  const handleAddExam = () => {
    setPatient(prevPatient => ({
      ...prevPatient,
      exams: [...prevPatient.exams, { date: '', type: '', result: '', file: null, id: null }],
    }));
  };

  const handleRemoveExam = (index) => {
    setPatient(prevPatient => {
      const newExams = prevPatient.exams.filter((_, i) => i !== index);
      setSelectedFiles(prevFiles => {
        const updatedFiles = { ...prevFiles };
        delete updatedFiles[index]; // Supprime le fichier sélectionné s'il était présent
        return updatedFiles;
      });
      setFormErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith(`exams.${index}.`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
      return { ...prevPatient, exams: newExams };
    });
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!patient.firstName) { errors.firstName = 'Le prénom est requis.'; isValid = false; }
    if (!patient.lastName) { errors.lastName = 'Le nom est requis.'; isValid = false; }
    if (!patient.email) {
      errors.email = 'L\'email est requis.'; isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(patient.email)) {
      errors.email = 'L\'email est invalide.'; isValid = false;
    }
    if (!patient.phone) { errors.phone = 'Le numéro de téléphone est requis.'; isValid = false; }

    patient.medicalHistory.forEach((record, index) => {
      if (!record.year) { errors[`medicalHistory.${index}.year`] = 'L\'année est requise.'; isValid = false; }
      if (!record.event) { errors[`medicalHistory.${index}.event`] = 'L\'événement est requis.'; isValid = false; }
    });

    patient.exams.forEach((exam, index) => {
      if (!exam.date) { errors[`exams.${index}.date`] = 'La date est requise.'; isValid = false; }
      if (!exam.type) { errors[`exams.${index}.type`] = 'Le type d\'examen est requis.'; isValid = false; }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/connexion');
        return;
      }

      const formData = new FormData();

      formData.append('firstName', patient.firstName);
      formData.append('lastName', patient.lastName);
      formData.append('email', patient.email);
      formData.append('dateOfBirth', patient.dateOfBirth);
      formData.append('gender', patient.gender);
      formData.append('address', patient.address || '');
      formData.append('phone', patient.phone);
      formData.append('bloodType', patient.bloodType || '');
      formData.append('allergies', patient.allergies || '');
      formData.append('chronicConditions', patient.chronicConditions || '');
      formData.append('currentMedications', patient.currentMedications || '');


      patient.medicalHistory.forEach((record, index) => {
        formData.append(`medicalHistory[${index}][year]`, record.year);
        formData.append(`medicalHistory[${index}][event]`, record.event);
        if (record.id) { // Inclure l'ID si l'enregistrement existe déjà
          formData.append(`medicalHistory[${index}][id]`, record.id);
        }
      });

      patient.exams.forEach((exam, index) => {
        // Inclure l'ID si l'examen existe déjà
        if (exam.id) {
          formData.append(`exams[${index}][id]`, exam.id);
        }

        // Conversion de la date (qui est en YYYY-MM-DD dans l'état) au format 'JJ/MM/AAAA' pour le backend
        let dateToSubmit = '';
        if (exam.date) {
            const dateObj = new Date(exam.date); // Parse YYYY-MM-DD
            if (!isNaN(dateObj.getTime())) { // Vérifie si la date est valide
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Mois sont 0-indexés
                const year = dateObj.getFullYear();
                dateToSubmit = `${day}/${month}/${year}`;
            }
        }
        formData.append(`exams[${index}][date]`, dateToSubmit);

        formData.append(`exams[${index}][type]`, exam.type);
        formData.append(`exams[${index}][result]`, exam.result || '');
        
        // Logique pour l'envoi des fichiers :
        if (selectedFiles[index]) {
            // Un nouveau fichier a été sélectionné (objet File)
            formData.append(`exams[${index}][file]`, selectedFiles[index]);
            // N'envoyez PAS 'existing_file' si un nouveau fichier est uploadé
        } else if (exam.file && typeof exam.file === 'string' && !exam.file.startsWith('blob:')) {
            // C'est un fichier existant, non modifié, on envoie son nom comme une chaîne
            // Utilisez un nom de champ différent pour qu'il ne soit pas validé comme un upload de fichier
            formData.append(`exams[${index}][existing_file]`, exam.file);
        } else {
            // Pas de fichier, ou fichier supprimé, ou un fichier temporaire (blob) qu'on ne veut pas envoyer
            // Indique au backend qu'il n'y a pas de fichier ou que l'ancien doit être supprimé
            formData.append(`exams[${index}][existing_file]`, ''); 
        }
      });

      formData.append('_method', 'PUT'); // Utilisation de _method pour simuler PUT avec POST

      const response = await fetch('http://localhost:8000/api/patient/profile', {
        method: 'POST', // La méthode POST est utilisée avec FormData et _method=PUT
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          // NE PAS définir 'Content-Type' avec FormData, le navigateur le fait automatiquement avec boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreurs de validation du backend:", errorData.errors);
        if (response.status === 422 && errorData.errors) {
          setFormErrors(errorData.errors);
          const detailedErrors = Object.values(errorData.errors).flat().join('\n');
          alert(`Veuillez corriger les erreurs de validation :\n${detailedErrors}`);
        } else if (response.status === 401 || response.status === 403) {
            navigate('/connexion');
            return;
        } else {
          throw new Error(errorData.message || 'Échec de l\'enregistrement du profil.');
        }
      } else {
        const data = await response.json();
        alert(data.message);
        setSelectedFiles({}); // Réinitialise les fichiers sélectionnés après un succès
        // Après l'enregistrement réussi, rediriger vers la page du profil
        navigate('/profil'); // MODIFICATION ICI
      }

    } catch (err) {
      console.error("Erreur lors de l'enregistrement du profil:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profil'); // Naviguer vers la page d'affichage du profil patient
  };

  if (loading) {
    return <div className="dpd-loading-message">Chargement du profil...</div>;
  }

  if (error) {
    return <div className="dpd-error-message">Erreur: {error}</div>;
  }

  return (
    <div className="edit-patient-profile-wrapper">
      <div className="edit-patient-profile-container">
        <div className="edit-patient-profile-form">
          <div className="edit-patient-profile-header">
            <Edit size={24} />
            <h2>Modifier le Profil Patient</h2>
          </div>
          <div className="edit-patient-profile-section">
            <div className="edit-patient-profile-section-header">
              <User size={20} />
              <h3>Informations Personnelles</h3>
            </div>
            <div className="edit-patient-profile-section-content">
              <form onSubmit={handleSubmit}>
                <div className="edit-patient-profile-form-grid">
                  <div className="edit-patient-profile-form-group">
                    <label className="edit-patient-profile-form-label" htmlFor="firstName">Prénom:</label>
                    <input 
                      className="edit-patient-profile-input" 
                      type="text" 
                      id="firstName" 
                      name="firstName" 
                      value={patient.firstName} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.firstName && <span className="edit-patient-profile-error-message">{formErrors.firstName}</span>}
                  </div>
                  <div className="edit-patient-profile-form-group">
                    <label className="edit-patient-profile-form-label" htmlFor="lastName">Nom:</label>
                    <input 
                      className="edit-patient-profile-input" 
                      type="text" 
                      id="lastName" 
                      name="lastName" 
                      value={patient.lastName} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.lastName && <span className="edit-patient-profile-error-message">{formErrors.lastName}</span>}
                  </div>
                  <div className="edit-patient-profile-form-group">
                    <label className="edit-patient-profile-form-label" htmlFor="email">Email:</label>
                    <input 
                      className="edit-patient-profile-input" 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={patient.email} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.email && <span className="edit-patient-profile-error-message">{formErrors.email}</span>}
                  </div>
                  <div className="edit-patient-profile-form-group">
                    <label className="edit-patient-profile-form-label" htmlFor="dateOfBirth">Date de Naissance:</label>
                    <input 
                      className="edit-patient-profile-input" 
                      type="date" 
                      id="dateOfBirth" 
                      name="dateOfBirth" 
                      value={patient.dateOfBirth} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.dateOfBirth && <span className="edit-patient-profile-error-message">{formErrors.dateOfBirth}</span>}
                  </div>
                  <div className="edit-patient-profile-form-group">
                    <label className="edit-patient-profile-form-label" htmlFor="gender">Genre:</label>
                    <select 
                      className="edit-patient-profile-select" 
                      id="gender" 
                      name="gender" 
                      value={patient.gender} 
                      onChange={handleInputChange}
                    >
                      <option value="">Sélectionner</option>
                      <option value="Male">Homme</option>
                      <option value="Female">Femme</option>
                      <option value="Other">Autre</option>
                    </select>
                    {formErrors.gender && <span className="edit-patient-profile-error-message">{formErrors.gender}</span>}
                  </div>
                  <div className="edit-patient-profile-form-group">
                    <label className="edit-patient-profile-form-label" htmlFor="address">Adresse:</label>
                    <input 
                      className="edit-patient-profile-input" 
                      type="text" 
                      id="address" 
                      name="address" 
                      value={patient.address} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="edit-patient-profile-form-group">
                    <label className="edit-patient-profile-form-label" htmlFor="phone">Téléphone:</label>
                    <input 
                      className="edit-patient-profile-input" 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={patient.phone} 
                      onChange={handleInputChange} 
                    />
                    {formErrors.phone && <span className="edit-patient-profile-error-message">{formErrors.phone}</span>}
                  </div>
                  <div className="edit-patient-profile-form-group">
                    <label className="edit-patient-profile-form-label" htmlFor="bloodType">Groupe Sanguin:</label>
                    <input 
                      className="edit-patient-profile-input" 
                      type="text" 
                      id="bloodType" 
                      name="bloodType" 
                      value={patient.bloodType} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="edit-patient-profile-form-group edit-patient-profile-form-grid-full">
                    <label className="edit-patient-profile-form-label" htmlFor="allergies">Allergies:</label>
                    <textarea 
                      className="edit-patient-profile-textarea" 
                      id="allergies" 
                      name="allergies" 
                      value={patient.allergies} 
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  <div className="edit-patient-profile-form-group edit-patient-profile-form-grid-full">
                    <label className="edit-patient-profile-form-label" htmlFor="chronicConditions">Conditions Chroniques:</label>
                    <textarea 
                      className="edit-patient-profile-textarea" 
                      id="chronicConditions" 
                      name="chronicConditions" 
                      value={patient.chronicConditions} 
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  <div className="edit-patient-profile-form-group edit-patient-profile-form-grid-full">
                    <label className="edit-patient-profile-form-label" htmlFor="currentMedications">Médicaments Actuels:</label>
                    <textarea 
                      className="edit-patient-profile-textarea" 
                      id="currentMedications" 
                      name="currentMedications" 
                      value={patient.currentMedications} 
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>

                <div className="edit-patient-profile-section">
                  <div className="edit-patient-profile-section-header">
                    <Stethoscope size={20} />
                    <h3>Historique Médical</h3>
                  </div>
                  <div className="edit-patient-profile-section-content">
                    <div className="edit-patient-profile-medical-history">
                      <div className="edit-patient-profile-medical-history-list">
                        {patient.medicalHistory.map((record, index) => (
                          <div key={index} className="edit-patient-profile-medical-history-item">
                            <div className="edit-patient-profile-medical-history-year">
                              <input
                                className="edit-patient-profile-input"
                                type="number"
                                name="year"
                                placeholder="Année"
                                value={record.year}
                                onChange={(e) => handleMedicalHistoryChange(index, e)}
                              />
                              {formErrors[`medicalHistory.${index}.year`] && (
                                <span className="edit-patient-profile-error-message">{formErrors[`medicalHistory.${index}.year`]}</span>
                              )}
                            </div>
                            <div className="edit-patient-profile-medical-history-event">
                              <textarea
                                className="edit-patient-profile-textarea"
                                name="event"
                                placeholder="Événement"
                                value={record.event}
                                onChange={(e) => handleMedicalHistoryChange(index, e)}
                              ></textarea>
                              {formErrors[`medicalHistory.${index}.event`] && (
                                <span className="edit-patient-profile-error-message">{formErrors[`medicalHistory.${index}.event`]}</span>
                              )}
                            </div>
                            <div className="edit-patient-profile-medical-history-actions">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveMedicalHistory(index)} 
                                className="edit-patient-profile-btn edit-patient-profile-btn-danger edit-patient-profile-btn-small"
                              >
                                <MinusCircle size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAddMedicalHistory} 
                        className="edit-patient-profile-btn edit-patient-profile-btn-add"
                      >
                        <PlusCircle size={20} /> Ajouter un historique
                      </button>
                    </div>
                  </div>
                </div>

                <div className="edit-patient-profile-section">
                  <div className="edit-patient-profile-section-header">
                    <BriefcaseMedical size={20} />
                    <h3>Examens</h3>
                  </div>
                  <div className="edit-patient-profile-section-content">
                    <div className="edit-patient-profile-exams-section">
                      {patient.exams.map((exam, index) => (
                        <div key={index} className="edit-patient-profile-exam-item">
                          <div className="edit-patient-profile-exam-header">
                            <div className="edit-patient-profile-form-group">
                              <label className="edit-patient-profile-form-label">Date:</label>
                              <input
                                className="edit-patient-profile-input"
                                type="date"
                                name="date"
                                placeholder="Date (JJ/MM/AAAA)"
                                value={exam.date}
                                onChange={(e) => handleExamChange(index, e)}
                              />
                              {formErrors[`exams.${index}.date`] && <span className="edit-patient-profile-error-message">{formErrors[`exams.${index}.date`]}</span>}
                            </div>
                            <div className="edit-patient-profile-form-group">
                              <label className="edit-patient-profile-form-label">Type d'examen:</label>
                              <input
                                className="edit-patient-profile-input"
                                type="text"
                                name="type"
                                placeholder="Type d'examen"
                                value={exam.type}
                                onChange={(e) => handleExamChange(index, e)}
                              />
                              {formErrors[`exams.${index}.type`] && <span className="edit-patient-profile-error-message">{formErrors[`exams.${index}.type`]}</span>}
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveExam(index)} 
                              className="edit-patient-profile-btn edit-patient-profile-btn-danger edit-patient-profile-btn-small"
                            >
                              <MinusCircle size={16} />
                            </button>
                          </div>
                          <div className="edit-patient-profile-exam-details">
                            <div className="edit-patient-profile-form-group">
                              <label className="edit-patient-profile-form-label">Résultat principal:</label>
                              <textarea
                                className="edit-patient-profile-textarea"
                                name="result"
                                placeholder="Résultat principal"
                                value={exam.result}
                                onChange={(e) => handleExamChange(index, e)}
                              ></textarea>
                              {formErrors[`exams.${index}.result`] && <span className="edit-patient-profile-error-message">{formErrors[`exams.${index}.result`]}</span>}
                            </div>
                            <div className="edit-patient-profile-form-group edit-patient-profile-exam-file-section">
                              <label className="edit-patient-profile-form-label">Fichier:</label>
                              <label className="edit-patient-profile-file-upload">
                                <input
                                  type="file"
                                  name="file"
                                  onChange={(e) => handleExamFileChange(index, e)}
                                />
                                <span>{exam.file ? exam.file.split('/').pop() : "Choisir un fichier"}</span>
                              </label>
                              {formErrors[`exams.${index}.file`] && <span className="edit-patient-profile-error-message">{formErrors[`exams.${index}.file`]}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={handleAddExam} 
                        className="edit-patient-profile-btn edit-patient-profile-btn-add"
                      >
                        <PlusCircle size={20} /> Ajouter un examen
                      </button>
                    </div>
                  </div>
                </div>

                <div className="edit-patient-profile-form-actions">
                  <button 
                    type="button" 
                    className="edit-patient-profile-btn edit-patient-profile-btn-secondary" 
                    onClick={handleCancel} 
                    disabled={isSaving}
                  >
                    <XCircle size={20} /> Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="edit-patient-profile-btn edit-patient-profile-btn-primary" 
                    disabled={isSaving}
                  >
                    {isSaving ? 'Enregistrement...' : <><Save size={20} /> Enregistrer</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPatientProfile;
