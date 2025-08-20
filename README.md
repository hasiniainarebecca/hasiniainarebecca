GISS - Gestion Intégrée des Soins de Santé
Aperçu

GISS (Gestion Intégrée des Soins de Santé) est une application web moderne qui vise à améliorer la communication et la gestion des services de santé.
Elle met en relation patients, médecins, infirmiers/anesthésistes et pharmaciens dans un écosystème unique, simplifiant la gestion des soins et favorisant un meilleur suivi médical.

I-Fonctionnalités principales
    1-Patients
    Consultations médicales en ligne
    Gestion des rendez-vous
    Commandes de médicaments (avec ou sans ordonnance)
    Dossier médical électronique
    Notifications en temps réel

    2-Docteurs
    Création et envoi d’ordonnances
    Gestion des emplois du temps et des gardes
    Suivi des patients
    Consultations en ligne

    3-Infirmiers / Anesthésistes
    Gestion et suivi des soins
    Gestion du matériel médical
    Collaboration avec l’équipe médicale
    Notifications sur les ajouts de matériel ou soins effectués

    4-Pharmaciens
    Gestion du stock de médicaments
    Validation et traitement des commandes (ordonnance / sans ordonnance)
    Suivi des ventes et prescriptions
    Messagerie avec patients et professionnels

II-Technologies utilisées
    1-Frontend
    ⚛ React + Vite
    CSS pour le design

    2-Backend
    Laravel(PHP)
    API RESTful pour la communication frontend-backend

    3-Base de données
    MySQL

    4-Notifications & Temps réel
    WebSockets
    Firebase Cloud Messaging

III-Structure du projet
    GISS/
    │── frontend/         # Code React + Vite
    │── backend/          # Code Laravel
    │── database/         # Scripts de base de données MySQL
    │── docs/             # Documentation & diagrammes
    │── README.md         # Documentation principale

IV-Installation & Utilisation
    1-Cloner le projet
    git clone https://github.com/hasiniainarebecca/hasiniainarebecca.git
    cd GISS

    2-Installation du backend (Laravel)
    cd backend
    composer install
    cp .env.example .env
    php artisan key:generate
    php artisan migrate --seed
    php artisan serve    

    3-Installation du frontend (React + Vite)
    cd frontend
    npm install
    npm run dev

    4-Accéder à l’application
    Frontend : http://localhost:5173
    Backend API : http://localhost:8000

V-Auteurs
    Projet développé dans le cadre d’un mémoire de licence par :
    ANDRIANTSOA Hasiniaina Rebecca

VI-Licence
    Ce projet est sous licence MIT. Vous pouvez l’utiliser, le modifier et le distribuer librement.
