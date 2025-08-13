<?php

namespace App\Notifications;

use App\Models\Prescription;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Broadcasting\PrivateChannel; // Gardez cette ligne si vous utilisez le broadcasting

class PrescriptionNotification extends Notification implements ShouldQueue // Implémentez ShouldQueue si vous utilisez des queues pour les notifications
{
    use Queueable;

    public $prescription;
    public $status;
    public $doctor;
    public $patient;

    /**
     * Create a new notification instance.
     *
     * @param  \App\Models\Prescription  $prescription
     * @param  string  $status
     * @param  \App\Models\User|null  $doctor
     * @param  \App\Models\User|null  $patient
     * @return void
     */
    public function __construct(Prescription $prescription, string $status, ?User $doctor = null, ?User $patient = null)
    {
        $this->prescription = $prescription;
        $this->status = $status;
        $this->doctor = $doctor;
        $this->patient = $patient;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via(object $notifiable): array
    {
        // Les canaux de livraison seront 'database' pour le stockage et 'broadcast' pour le temps réel
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $title = '';
        $msg = '';
        $icon = 'file'; // Default icon for prescriptions

        switch ($this->status) {
            case 'created':
                $title = 'Nouvelle Ordonnance';
                $msg = 'Dr. ' . ($this->doctor ? $this->doctor->prenom . ' ' . $this->doctor->nom : 'Inconnu') . ' vous a envoyé une nouvelle ordonnance.';
                // Définissez un icône spécifique si besoin, ex: 'prescription-new'
                break;
            case 'sent':
                $title = 'Ordonnance Envoyée';
                $msg = 'Votre ordonnance a été marquée comme envoyée.';
                // Définissez un icône spécifique si besoin, ex: 'prescription-sent'
                break;
            case 'updated':
                $title = 'Ordonnance Mise à Jour';
                $msg = 'Votre ordonnance a été mise à jour.';
                // Définissez un icône spécifique si besoin, ex: 'prescription-updated'
                break;
            case 'renewal_requested':
                $title = 'Demande de Renouvellement Ordonnance';
                $msg = 'Une demande de renouvellement a été faite pour l\'ordonnance ID: ' . $this->prescription->id . '.';
                // Cet état sera probablement pour le médecin ou le pharmacien
                break;
            case 'validated':
                $title = 'Ordonnance Validée (Pharmacie)';
                $msg = 'L\'ordonnance ID: ' . $this->prescription->id . ' a été validée par une pharmacie.';
                // Cet état sera pour le patient et potentiellement le médecin
                break;
            // Ajoutez d'autres cas si vous avez d'autres statuts pertinents pour les notifications
            default:
                $title = 'Notification d\'Ordonnance';
                $msg = 'Une mise à jour concernant votre ordonnance.';
                break;
        }

        return [
            'type' => 'prescription', // Important pour le filtrage côté frontend
            'prescription_id' => $this->prescription->id,
            'title' => $title,
            'message' => $msg,
            'status' => $this->status,
            'doctor_id' => $this->doctor ? $this->doctor->id : null,
            'patient_id' => $this->patient ? $this->patient->id : null,
            'icon' => $icon, // L'icône que vous utiliserez dans les composants React
            'time' => now()->toDateTimeString(), // Horodatage pour l'affichage
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\BroadcastMessage
     */
    public function toBroadcast(object $notifiable): \Illuminate\Notifications\Messages\BroadcastMessage
    {
        // Les données qui seront diffusées en temps réel via Laravel Echo
        return new \Illuminate\Notifications\Messages\BroadcastMessage([
            'id' => $this->id, // L'ID de la notification généré par Laravel
            'type' => 'prescription', // Type de notification
            'data' => $this->toArray($notifiable), // Réutilise les données formatées par toArray
            'read_at' => null, // Indique qu'elle n'est pas encore lue (par défaut)
            'created_at' => now()->toDateTimeString(), // Horodatage de création
        ]);
    }
}