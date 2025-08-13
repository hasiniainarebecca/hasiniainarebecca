// src/App.jsx
import { useState } from 'react';
import { useNavigate, Navigate } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import './App.css';
// Import de la configuration axios
import './utils/axiosConfig'; // Ajoutez cette ligne

import Login from './login';
import SignupForm from './inscription';
import PatientDashboard from './PatientDashboard';
import DocteurDashboard from './DocteurDashboard';
import InfirmierDashboard from './InfirmierDashboard';
import Acceuil from './acceuil';

import Sidebardoctor from './components/sidebardoctor';
import Sidebarinfirmier from './components/sidebarinfirmier';
import AppointmentForm from './appointmentPatient';
import AppointmentList from './AppointmentList';
import DoctorAppointments from './DoctorAppointments';
import DoctorPrescriptionPage from './DoctorPrescriptionPage';
import PrescriptionsPage from './PrescriptionsPage';
import DraftPrescriptionsPage from './DraftPrescriptionsPage';
import DraftPrescriptionEditor from './DraftPrescriptionEditor';
import PharmacierDashboard from './PharmacietDashboard';
import SidebarPharma from './components/sidebarpharma';
import Sidebarpatient from './components/sidebar';

import MedicationManagementPage from './MedicationManagementPage';
import ValidationOrdonnance from './ValidationOrdonnance';
import Ventes from './Ventes';
import MessagePharmacie from './MessagePharmacie';
import PharmaciePatient from './PharmaciePatient';
import DemandeRenouvellement from './PageRenouvellementOrd';
import EmploitDuTempsDocteurPage from './EdtDocteur';
import EmploiTempsInfirmierPage from './EdtInfirmier';
import GestionMaterielMed from './PageMaterielMed';
import MessageDocteur from './MessageDocteur';
import MessageInfirmier from './MessageInfirmier';
import MessagePatient from './MessagePatient';

import MesServicesInf from './MesServicesInf';
// import AddServiceModal from './AjoutNouvServiceInf'; // Removed as it's a modal, not a standalone route
import DemandeServiceInf from './DemandeServiceInf';
import DemandeServicePatient from './DemandeServicePatient';
import ServiceCatalogPatient from './ServiceCatalogPatient';
import ConsultationVideoDocteur from './ConsultationVideoDocteur';
import DoctorOnlineConsultationsList from './DoctorOnlineConsultationsList';
import PatientOnlineConsultationsList from './PatientOnlineConsultationsList';
import ConsultationVideoPatient from './ConsultationVideoPatient';

// NEW: Import the patient list and patient details components for the doctor
import DoctorPatientList from './DoctorPatientList';
import DoctorPatientDetails from './DoctorPatientDetails';
import PatientRecordsInfirmier from './DossierPatientInfirmier';
import PatientProfile from './PatientProfile';
import EditPatientProfile from './EditPatientProfile';
import NotificationsPatientsPage from './NotificationsPatientsPage';
import NotificationsDocteurPage from './NotificationsDocteurPage';
import NotificationsInfirmierPage from './NotificationsInfirmierPage';
import NotificationsPharmaPage from './NotificationsPharmaPage';


const App = () => {
  return (
    <Router>
      <MainApp />
    </Router>
  );
};

const RequireAuth = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('user') && !!localStorage.getItem('token');
  return isLoggedIn ? children : <Navigate to="/connexion" replace />;
};

const MainApp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const hideSidebarRoutes = ['/', '/connexion', '/inscription'];
  const isAuthPage = hideSidebarRoutes.includes(location.pathname);

  const getSidebarComponent = () => {
    if (location.pathname.startsWith('/dashboard/patient') ||
    location.pathname.startsWith('/appointments') ||
    location.pathname.startsWith('/patient/rendez-vous') ||
    location.pathname.startsWith('/patient/prescription') ||
    location.pathname.startsWith('/patient/consultation-video/') ||
    location.pathname.startsWith('/patient/online-consultations') ||
    location.pathname.startsWith('/pharmacie') ||
    location.pathname.startsWith('/message-patient') ||
    location.pathname.startsWith('/patient-service') ||
    location.pathname.startsWith('/service') ||
    location.pathname.startsWith('/edit-patient-profile') ||
    location.pathname.startsWith('/patient-notification') ||
    location.pathname.startsWith('/profil')) return <Sidebarpatient />;

    if (location.pathname.startsWith('/dashboard/docteur') ||
    location.pathname.startsWith('/docteur/rendez-vous') ||
    location.pathname.startsWith('/docteur/prescription') ||
    location.pathname.startsWith('/docteur/brouillons') ||
    location.pathname.startsWith('/docteur/brouillons/modifier') ||
    location.pathname.startsWith('/doctor/consultation-video/') ||
    location.pathname.startsWith('/emplois-du-Temps') ||
    location.pathname.startsWith('/message-docteur') ||
    location.pathname.startsWith('/dossier-patient-docteur') ||
    location.pathname.startsWith('/page-renouvellement-ordonnance') ||
    location.pathname.startsWith('/docteur-notification') ||
    location.pathname.startsWith('/doctor/online-consultations')) return <Sidebardoctor />;

    if (location.pathname.startsWith('/dashboard/infirmier') ||
    location.pathname.startsWith('/emploisDuTemps') ||
    location.pathname.startsWith('/gestion-materiel-medical') ||
    location.pathname.startsWith('/message-infirmier') ||
    location.pathname.startsWith('/dossier-patient-infirmier') ||
    location.pathname.startsWith('/infirmier-demande-service') ||
    location.pathname.startsWith('/infirmier-notification') ||
    location.pathname.startsWith('/infirmier-service')) return <Sidebarinfirmier />;

    if (location.pathname.startsWith('/dashboard/pharmacien') ||
    location.pathname.startsWith('/gestion-stock') ||
    location.pathname.startsWith('/validation-ordonnance') ||
    location.pathname.startsWith('/suivi-ventes') ||
    location.pathname.startsWith('/notification/pharmacie') ||
    location.pathname.startsWith('/message-pharmacie')) return <SidebarPharma/>;

    return null;
  };

  return (
    <div className="app-container">
      {!isAuthPage && getSidebarComponent()}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<Acceuil />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<SignupForm />} />
          <Route path="/dashboard/patient" element={<RequireAuth><PatientDashboard /></RequireAuth>} />
          <Route path="/appointments" element={<RequireAuth><AppointmentForm/></RequireAuth>}/>
          <Route path="/patient/rendez-vous" element={<RequireAuth><AppointmentList /></RequireAuth>} />
          <Route path="/docteur/rendez-vous" element={<RequireAuth><DoctorAppointments /></RequireAuth>} />
          <Route path="/dashboard/docteur" element={<RequireAuth><DocteurDashboard /></RequireAuth>} />
          <Route path="/dashboard/infirmier" element={<RequireAuth><InfirmierDashboard /></RequireAuth>} />
          <Route path="/docteur/prescription" element={<RequireAuth><DoctorPrescriptionPage /></RequireAuth>} />
          <Route path="/patient/prescription" element={<RequireAuth><PrescriptionsPage /></RequireAuth>} />
          <Route path="/docteur/brouillons" element={<RequireAuth><DraftPrescriptionsPage
            onEditDraft={(draftId) => navigate(`/docteur/brouillons/modifier/${draftId}`)}
          /></RequireAuth>} />
          <Route path="/docteur/brouillons/modifier/:id" element={<RequireAuth><DraftPrescriptionEditor /></RequireAuth>} />
          <Route path="/dashboard/pharmacien" element={<RequireAuth><PharmacierDashboard/></RequireAuth>}/>
          <Route path="/gestion-stock" element={<RequireAuth><MedicationManagementPage/></RequireAuth>}/>
          <Route path='/validation-ordonnance' element={<RequireAuth><ValidationOrdonnance/></RequireAuth>} />
          <Route path='/suivi-ventes' element={<RequireAuth><Ventes/></RequireAuth>}/>
          <Route path='/message-pharmacie' element={<RequireAuth><MessagePharmacie/></RequireAuth>}/>
          <Route path='/pharmacie' element={<RequireAuth><PharmaciePatient/></RequireAuth>}/>
          <Route path='/page-renouvellement-ordonnance' element={<RequireAuth><DemandeRenouvellement/></RequireAuth>}/>
          <Route path='/emplois-du-Temps' element={<RequireAuth><EmploitDuTempsDocteurPage/></RequireAuth>}/>
          <Route path='/emploisDuTemps' element={<RequireAuth><EmploiTempsInfirmierPage/></RequireAuth>}/>
          <Route path='/gestion-materiel-medical' element={<RequireAuth><GestionMaterielMed/></RequireAuth>}/>
          <Route path='/message-docteur' element={<RequireAuth><MessageDocteur/></RequireAuth>}/>
          <Route path='/message-infirmier' element={<RequireAuth><MessageInfirmier/></RequireAuth>}/>
          <Route path='/message-patient' element={<RequireAuth><MessagePatient/></RequireAuth>}/>
          <Route path="/infirmier-service" element={<RequireAuth><MesServicesInf /></RequireAuth>} />
          <Route path="/infirmier-demande-service" element={<RequireAuth><DemandeServiceInf /></RequireAuth>} />
          <Route path="/service" element={<RequireAuth><DemandeServicePatient /></RequireAuth>} />
          <Route path="/patient-service" element={<RequireAuth><ServiceCatalogPatient /></RequireAuth>} />
          <Route path="/doctor/consultation-video/:conferenceId" element={<RequireAuth><ConsultationVideoDocteur /></RequireAuth>} />
          <Route path='/doctor/online-consultations' element={<RequireAuth><DoctorOnlineConsultationsList /></RequireAuth>} />
          <Route path='/patient/online-consultations' element={<RequireAuth><PatientOnlineConsultationsList /></RequireAuth>} />
          <Route path="/patient/consultation-video/:conferenceId" element={<RequireAuth><ConsultationVideoPatient /></RequireAuth>} />
          <Route path='/dossier-patient-docteur' element={<RequireAuth><DoctorPatientList /></RequireAuth>} />
          <Route path='/dossier-patient-docteur/:patientId' element={<RequireAuth><DoctorPatientDetails /></RequireAuth>} />
          <Route path='/dossier-patient-infirmier' element={<RequireAuth><PatientRecordsInfirmier /></RequireAuth>} />
          <Route path='/profil' element={<RequireAuth><PatientProfile /></RequireAuth>} />
          <Route path='/edit-patient-profile' element={<RequireAuth><EditPatientProfile /></RequireAuth>} />
          <Route path='/patient-notification' element={<RequireAuth><NotificationsPatientsPage /></RequireAuth>} />
          <Route path='/docteur-notification' element={<RequireAuth><NotificationsDocteurPage /></RequireAuth>} />
          <Route path='/infirmier-notification' element={<RequireAuth><NotificationsInfirmierPage /></RequireAuth>} />
          <Route path='/notification/pharmacie' element={<RequireAuth><NotificationsPharmaPage /></RequireAuth>} />
        </Routes>
      </div>
    </div>
  );
};

export default App;