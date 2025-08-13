<?php

namespace App\Notifications;

use App\Models\User;
    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Notifications\Notification;
    use Illuminate\Notifications\Messages\BroadcastMessage;

    class PatientProfileUpdatedNotification extends Notification implements ShouldQueue
    {
        use Queueable;

        public $patient;

        /**
         * Create a new notification instance.
         *
         * @param  \App\Models\User  $patient
         * @return void
         */
        public function __construct(User $patient)
        {
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
            return ['database', 'broadcast'];
        }

        /**
         * Get the array representation of the notification.
         *
         * @param  mixed  $notifiable
         * @return array
         */
        public function toArray(object $notifiable): array
        {
            return [
                'type' => 'patient_profile_update',
                'patient_id' => $this->patient->id,
                'patient_name' => "{$this->patient->prenom} {$this->patient->nom}",
                'title' => 'Mise à jour du dossier patient',
                'message' => "{$this->patient->prenom} {$this->patient->nom} a modifié son dossier médical.",
                'time' => now()->toDateTimeString(),
                'icon' => 'file-text', // Icône pour les dossiers médicaux
            ];
        }

        /**
         * Get the broadcastable representation of the notification.
         *
         * @param  mixed  $notifiable
         * @return \Illuminate\Notifications\Messages\BroadcastMessage
         */
        public function toBroadcast(object $notifiable): BroadcastMessage
        {
            return new BroadcastMessage([
                'id' => $this->id,
                'type' => 'patient_profile_update',
                'data' => $this->toArray($notifiable),
                'read_at' => null,
                'created_at' => now()->toDateTimeString(),
            ]);
        }
    }
