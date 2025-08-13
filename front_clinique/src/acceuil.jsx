import { Link } from "react-router-dom"
import { Shield, UserIcon, DoctorIcon, NurseIcon } from "./components/Icons"
import "./styles/Home.css"

const Acceuil = () => {
    return (
        <div className="giss-home-container">
          <header className="giss-header">
            <div className="giss-logo">
              <Shield />
              <span className="giss-logo-text">GISS</span>
            </div>
            <nav className="giss-nav-links">
              <Link to="/connexion" className="giss-login-btn">
                Connexion
              </Link>
              <Link to="/inscription" className="giss-register-btn">
                Inscription
              </Link>
            </nav>
          </header>
    
          <main className="giss-main">
            <div className="bg-image"></div>
            <section className="giss-hero-section">
              <div className="giss-hero-overlay">
                <div className="giss-hero-content">
                  <h1 className="giss-hero-title">Gestion Intégrée des Soins de Santé</h1>
                  <p className="giss-hero-description">
                    Une plateforme complète pour connecter les patients et les professionnels de santé, 
                    simplifier la gestion des soins et améliorer l'expérience médicale.
                  </p>
                  <div className="giss-hero-actions">
                    <Link to="/inscription" className="giss-cta-primary">
                      Commencer maintenant
                    </Link>
                    <Link to="/connexion" className="giss-cta-secondary">
                      Se connecter
                    </Link>
                  </div>
                </div>
              </div>
            </section>
    
            <section className="giss-services-section">
              <div className="giss-services-container">
                <h2 className="giss-services-title">Nos Services</h2>
                <div className="giss-services-grid">
                  <div className="giss-service-card">
                    <div className="giss-service-icon giss-icon-patient">
                      <UserIcon />
                    </div>
                    <h3 className="giss-service-card-title">Pour les Patients</h3>
                    <p className="giss-service-card-description">
                      Gérez vos rendez-vous, consultez vos ordonnances et communiquez avec vos médecins.
                    </p>
                  
                  </div>
        
                  <div className="giss-service-card">
                    <div className="giss-service-icon giss-icon-doctor">
                      <DoctorIcon />
                    </div>
                    <h3 className="giss-service-card-title">Pour les Docteurs</h3>
                    <p className="giss-service-card-description">
                      Gérez vos patients, prescrivez des médicaments et organisez vos consultations.
                    </p>
                    
                  </div>
        
                  <div className="giss-service-card">
                    <div className="giss-service-icon giss-icon-nurse">
                      <NurseIcon />
                    </div>
                    <h3 className="giss-service-card-title">Pour les Infirmières et Anesthésistes</h3>
                    <p className="giss-service-card-description">
                      Proposez vos services, gérez vos horaires et suivez les soins des patients.
                    </p>
            
                  </div>

                  <div className="giss-service-card">
                    <div className="giss-service-icon giss-icon-pharmacy">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 8h-2V5c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v3H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 5h6v3H9V5zm4 10h-2v-2H9v-2h2v-2h2v2h2v2h-2v2z"/>
                      </svg>
                    </div>
                    <h3 className="giss-service-card-title">Pour les Pharmaciens</h3>
                    <p className="giss-service-card-description">
                      Gérez les ordonnances, suivez les stocks et conseiller les patients.
                    </p>
                    
                  </div>
                </div>
              </div>
            </section>
          </main>
    
          <footer className="giss-footer">
            <div className="giss-footer-content">
              <p>&copy; 2025 GISS - Gestion Intégrée des Soins de Santé. Tous droits réservés.</p>
            </div>
          </footer>
        </div>
      )
};

export default Acceuil;