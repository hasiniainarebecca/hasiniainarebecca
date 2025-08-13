<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User; // Assurez-vous d'importer le modèle User
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage; // Si vous voulez envoyer par email aussi
use Illuminate\Broadcasting\PrivateChannel; // Pour les notifications en temps réel

class RendezVousNotification extends Notification // Noms de variables en français
{
    use Queueable;

    public $rendezVous; // Utilisez 'rendezVous' au lieu de 'appointment'
    public $statut;     // Utilisez 'statut' au lieu de 'status'
    public $docteur;    // Utilisez 'docteur' au lieu de 'doctor'
    public $patient;    // Ajoutez le patient si nécessaire pour la notification docteur

    /**
     * Crée une nouvelle instance de notification.
     *
     * @param  \App\Models\Appointment  $rendezVous
     * @param  string  $statut
     * @param  \App\Models\User|null  $docteur (optionnel, pour certaines notifications)
     * @param  \App\Models\User|null  $patient (optionnel, pour certaines notifications)
     * @return void
     */
    public function __construct(Appointment $rendezVous, string $statut, ?User $docteur = null, ?User $patient = null)
    {
        $this->rendezVous = $rendezVous;
        $this->statut = $statut;
        $this->docteur = $docteur;
        $this->patient = $patient;
    }

    /**
     * Obtenez les canaux de notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via(object $notifiable): array
    {
        // Nous utiliserons 'database' pour stocker la notification
        // Et 'broadcast' pour les notifications en temps réel (si configuré)
        return ['database', 'broadcast'];
    }

    /**
     * Obtenez la représentation de tableau de la notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray(object $notifiable): array
    {
        $message = $this->getTexteMessage();

        // Structure des données qui seront stockées dans la colonne 'data' de la table 'notifications'
        return [
            'type' => 'rendez_vous', // Type générique pour le frontend
            'id_rendez_vous' => $this->rendezVous->id,
            'statut_rendez_vous' => $this->statut,
            'nom_docteur' => $this->docteur ? $this->docteur->nom . ' ' . $this->docteur->prenom : null,
            'nom_patient' => $this->patient ? $this->patient->nom . ' ' . $this->patient->prenom : null,
            'date_rendez_vous' => $this->rendezVous->appointment_date->format('d/m/Y'),
            'heure_rendez_vous' => $this->rendezVous->appointment_time,
            'message' => $message, // Le message affiché dans le frontend
        ];
    }

    /**
     * Obtenez le texte du message en fonction du statut et du destinataire.
     *
     * @return string
     */
    protected function getTexteMessage(): string
    {
        $message = "";
        $nomDocteur = $this->docteur ? $this->docteur->nom . ' ' . $this->docteur->prenom : 'un docteur';
        $nomPatient = $this->patient ? $this->patient->nom . ' ' . $this->patient->prenom : 'un patient';

        // Logique de message pour le patient
        if ($this->statut === 'accepte' && $this->rendezVous->patient_id === $this->idReceveur()) {
            $message = "Votre rendez-vous avec Dr. {$nomDocteur} a été accepté.";
        } elseif ($this->statut === 'refuse' && $this->rendezVous->patient_id === $this->idReceveur()) {
            $message = "Votre rendez-vous avec Dr. {$nomDocteur} a été refusé.";
        }
        // Logique de message pour le docteur
        elseif ($this->statut === 'reserve' && $this->rendezVous->doctor_id === $this->idReceveur()) {
            $message = "{$nomPatient} a réservé un rendez-vous avec vous.";
        }
        // Logique pour les rappels (à implémenter plus tard)
        // elseif ($this->statut === 'rappel' && ($this->rendezVous->patient_id === $this->idReceveur() || $this->rendezVous->doctor_id === $this->idReceveur())) {
        //     // Cette logique sera déclenchée par une tâche planifiée et non par une action CRUD directe
        //     if ($this->rendezVous->patient_id === $this->idReceveur()) {
        //         $message = "Votre rendez-vous avec Dr. {$nomDocteur} est pour demain à {$this->rendezVous->appointment_time}.";
        //     } else {
        //         $message = "Votre rendez-vous avec {$nomPatient} est pour demain à {$this->rendezVous->appointment_time}.";
        //     }
        // }

        return $message;
    }

    // Méthode utilitaire pour obtenir l'ID du receveur actuel de la notification
    // Cette méthode est un "hack" car `object $notifiable` ne donne pas l'ID directement
    // Si vous utilisez un événement et un écouteur, l'ID est connu dans l'écouteur
    // Pour `toBroadcast` ou `toArray`, $notifiable est l'instance du User qui reçoit.
    protected function idReceveur(): int
    {
        // Ceci doit être affiné si cette méthode est appelée dans un contexte où $this->notifiable n'est pas défini
        // Pour toArray et toBroadcast, $notifiable est le User qui reçoit la notification
        if (isset($this->notifiable) && $this->notifiable instanceof User) {
            return $this->notifiable->id;
        }
        // Si la notification est créée pour un patient ou un docteur spécifique,
        // vous pouvez stocker leur ID dans la classe pour y accéder ici.
        // Pour l'instant, on se base sur les IDs du rendez-vous
        return 0; // Valeur par défaut, à améliorer
    }

    /**
     * Obtenez la représentation de diffusion de la notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\BroadcastMessage
     */
    public function toBroadcast(object $notifiable): \Illuminate\Notifications\Messages\BroadcastMessage
    {
        // Les données qui seront diffusées via WebSocket (Laravel Echo)
        return new \Illuminate\Notifications\Messages\BroadcastMessage([
            'id' => $this->id, // L'ID de la notification (généré par Laravel)
            'type' => 'rendez_vous',
            'data' => $this->toArray($notifiable), // Réutilise les données déjà formatées
            'read_at' => null,
            'created_at' => now()->toDateTimeString(),
        ]);
    }
}