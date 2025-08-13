<?php

    namespace App\Notifications;

    use App\Models\Appointment;
    use App\Models\User;
    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Notifications\Notification;
    use Illuminate\Notifications\Messages\BroadcastMessage;

    class ConsultationNotification extends Notification implements ShouldQueue
    {
        use Queueable;

        public $appointment;
        public $status; // 'rappel', 'demarree'
        public $doctor;
        public $patient;

        /**
         * Create a new notification instance.
         *
         * @param  \App\Models\Appointment  $appointment
         * @param  string  $status
         * @param  \App\Models\User|null  $doctor
         * @param  \App\Models\User|null  $patient
         * @return void
         */
        public function __construct(Appointment $appointment, string $status, ?User $doctor = null, ?User $patient = null)
        {
            $this->appointment = $appointment;
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
            $title = "Notification de consultation";
            $message = "Une mise à jour concernant votre consultation.";
            $heureRendezVous = \Carbon\Carbon::parse($this->appointment->appointment_time)->format('H:i');

            // Logique pour le patient
            if ($notifiable->role === 'patient') {
                $doctorName = $this->doctor ? "Dr. {$this->doctor->prenom} {$this->doctor->nom}" : "un docteur";
                if ($this->status === 'rappel') {
                    $title = "Rappel de Consultation Vidéo";
                    $message = "Votre consultation vidéo avec {$doctorName} est à {$heureRendezVous}. Ne la ratez pas !";
                } elseif ($this->status === 'demarree') {
                    $title = "Consultation Vidéo Démarrée";
                    $message = "{$doctorName} a démarré la consultation vidéo. Rejoignez-le maintenant !";
                }
            }
            // Logique pour le docteur
            elseif ($notifiable->role === 'docteur') {
                $patientName = $this->patient ? "{$this->patient->prenom} {$this->patient->nom}" : "un patient";
                if ($this->status === 'rappel') {
                    $title = "Rappel de Consultation Vidéo";
                    $message = "Votre consultation vidéo avec {$patientName} est à {$heureRendezVous}. Ne la ratez pas !";
                }
            }

            return [
                'type' => 'consultation',
                'appointment_id' => $this->appointment->id,
                'status_consultation' => $this->status,
                'doctor_id' => $this->doctor ? $this->doctor->id : null,
                'patient_id' => $this->patient ? $this->patient->id : null,
                'doctor_name' => $this->doctor ? "Dr. {$this->doctor->prenom} {$this->doctor->nom}" : null,
                'patient_name' => $this->patient ? "{$this->patient->prenom} {$this->patient->nom}" : null,
                'appointment_time' => $heureRendezVous,
                'title' => $title,
                'message' => $message,
                'time' => now()->toDateTimeString(),
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
                'type' => 'consultation',
                'data' => $this->toArray($notifiable),
                'read_at' => null,
                'created_at' => now()->toDateTimeString(),
            ]);
        }
    }
