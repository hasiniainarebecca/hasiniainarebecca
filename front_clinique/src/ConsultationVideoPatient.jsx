import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/ConsultationVideo.css';

const ConsultationVideoPatient = () => {
    const { conferenceId } = useParams();
    const navigate = useNavigate();
    const jitsiNodeRef = useRef(null);
    const apiRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [jitsiError, setJitsiError] = useState(null);

    const domain = 'meet.jit.si';

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/user');
                setUser(response.data);
            } catch (err) {
                console.error('Erreur lors de la récupération des informations utilisateur:', err);
                setError('Impossible de récupérer vos informations. Veuillez vous reconnecter.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        if (!loading && !error && user && conferenceId && jitsiNodeRef.current) {
            let retryCount = 0;
            const MAX_RETRIES = 10;

            const initializeJitsi = () => {
                if (window.JitsiMeetExternalAPI) {
                    const roomName = `GISS_Consultation_${conferenceId}`;
                    const userName = user ? `${user.prenom} ${user.nom}` : 'Patient';

                    const options = {
                        roomName: roomName,
                        width: '100%',
                        height: '100%',
                        parentNode: jitsiNodeRef.current,
                        userInfo: {
                            displayName: userName
                        },
                        interfaceConfigOverwrite: {
                            DEFAULT_BACKGROUND: '#000000',
                            TOOLBAR_BUTTONS: [
                                'microphone', 'camera', 'desktop', 'fullscreen',
                                'fodeviceselection', 'hangup', 'profile', 'chat',
                                'settings', 'tileview', 'videoquality', 'filmstrip'
                            ],
                            SHOW_JITSI_WATERMARK: false,
                        },
                        configOverwrite: {
                            enableOutputSelector: false,
                            disableSimulcast: false,
                            startWithAudioMuted: false,
                            startWithVideoMuted: false,
                            prejoinPageEnabled: false,
                            defaultLanguage: 'fr',
                        },
                    };

                    try {
                        const api = new window.JitsiMeetExternalAPI(domain, options);
                        apiRef.current = api;

                        api.addEventListener('readyToClose', () => {
                            navigate('/patient/online-consultations');
                        });


                        api.addEventListener('videoConferenceLeft', () => {
                            axios.post(`http://localhost:8000/api/appointments/${conferenceId}/end-call`)
                                .catch(err => console.error("Erreur lors de l'appel end-call (Patient):", err));
                        });

                        api.addEventListener('API_ERROR', (apiError) => {
                            console.error("Jitsi API Error (Patient):", apiError);
                            setJitsiError("Une erreur est survenue lors du chargement de la consultation vidéo. Veuillez réessayer.");
                        });

                    } catch (e) {
                        console.error("Erreur lors de l'instanciation de JitsiMeetExternalAPI (Patient):", e);
                        setJitsiError("Impossible d'initialiser la consultation vidéo. Vérifiez le script Jitsi.");
                    }

                } else {
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        console.log(`Jitsi API non disponible (Patient), tentative ${retryCount}/${MAX_RETRIES}...`);
                        setTimeout(initializeJitsi, 500);
                    } else {
                        setJitsiError("L'API Jitsi Meet n'est pas chargée. Veuillez vérifier votre connexion ou l'intégration du script Jitsi.");
                    }
                }
            };

            initializeJitsi();

            return () => {
                if (apiRef.current) {
                    apiRef.current.dispose();
                    apiRef.current = null;
                }
            };
        }
    }, [loading, error, user, conferenceId, navigate]);

    if (loading) return <div className="video-consultation-container flex items-center justify-center">Chargement...</div>;
    if (error) return <div className="video-consultation-container flex items-center justify-center text-red-500">{error}</div>;
    if (jitsiError) return (
        <div className="video-consultation-container flex flex-col items-center justify-center text-red-500">
            <p>{jitsiError}</p>
            <button
                onClick={() => window.location.reload()}
                className="control-button mt-4"
            >
                Réessayer
            </button>
        </div>
    );

    if (!conferenceId) {
        return (
            <div className="video-consultation-container flex items-center justify-center text-red-500">
                ID de conférence manquant.
            </div>
        );
    }

    return (
        <div className="video-consultation-container">
            <div className="consultation-header">
                <h2>Consultation Vidéo - Salle: {conferenceId}</h2>
                <p>En tant que Patient</p>
            </div>

            <div className="video-area">
                <div className="main-video">
                    <div ref={jitsiNodeRef} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            <div className="call-controls">
                <button
                    onClick={() => {
                        if (apiRef.current) {
                            apiRef.current.executeCommand('hangup');
                        }
                        navigate('/patient/online-consultations');
                    }}
                    className="end-call-button"
                >
                    Quitter la consultation
                </button>
            </div>
        </div>
    );
};

export default ConsultationVideoPatient;