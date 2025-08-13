import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "./components/Icons";
import "./styles/Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate(); // Utilisation de useNavigate pour la redirection

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/connexion", {
                email,
                password,
            });

            console.log(response.data.token);
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user)); // Sauvegarde des données utilisateur
            if (response.data.user.pharmacie_id) {
                localStorage.setItem("pharmacy_id", response.data.user.pharmacie_id);
            }
            alert("Connexion réussie !");
            const userRole = response.data.user.role;
            console.log(userRole);

            if (userRole === 'patient') {
                navigate("/dashboard/patient");
            } else if (userRole === 'docteur') {
                navigate("/dashboard/docteur");
            } else if (userRole === 'infirmier') {
                navigate("/dashboard/infirmier");
            } else if (userRole === 'pharmacien') {
                navigate("/dashboard/pharmacien");
            }
             else {
                navigate("/connexion");
            }
        } catch (error) {
            setError("Identifiants incorrects !");
        }
    };

    return (
        <body className="no-sidebar login-page">
            <div className="main-content">
                <header className="giss-header">
                    <div className="giss-logo">
                        <Shield />
                        <span className="giss-logo-text">GISS</span>
                    </div>
                    <nav className="giss-nav-links">
                        <Link to="/" className="giss-login-btn">
                            Page d'accueil
                        </Link>
                        <Link to="/inscription" className="giss-register-btn">
                            Inscription
                        </Link>
                    </nav>
                </header>


                <div className="login-container">
                    <div className="login-card-description"></div>
                    <div className="login-card">
                        <div className="login-header">
                            <h1 className="login-title">CONNEXION</h1>
                            <div className="login-icon-container">
                                <Shield className="login-icon" />
                            </div>
                        </div>
                        <div className="login-form">
                            {error && <p className="login-error">{error}</p>}
                            <div className="login-input-group">
                                <label className="login-label">Email</label>
                                <input
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="login-input"
                                />
                            </div>
                            <div className="login-input-group">
                                <label className="login-label">Mot de passe</label>
                                <input
                                    type="password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="login-input"
                                />
                            </div>
                            <div className="login-actions">
                                <Link to="#" className="login-forgot-password">Mot de passe oublié?</Link>
                                <button onClick={handleLogin} className="login-button">Se connecter</button>
                            </div>
                        </div>
                        <div className="login-footer">
                            Vous n'avez pas de compte? <Link to="/inscription" className="login-register-link">S'inscrire</Link>
                        </div>
                    </div>
                </div>
            </div>
        </body>
    );
};

export default Login;