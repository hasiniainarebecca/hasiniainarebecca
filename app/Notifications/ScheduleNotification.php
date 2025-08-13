<?php

namespace App\Notifications;

    use App\Models\Garde;
    use App\Models\User;
    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Notifications\Notification;
    use Illuminate\Notifications\Messages\BroadcastMessage;
    use Carbon\Carbon;

    class ScheduleNotification extends Notification implements ShouldQueue
    {
        use Queueable;

        public $type_notification; // 'nouvelle_garde', 'garde_confirmee', 'garde_refusee', 'demande_echange', 'echange_accepte', 'echange_refuse'
        public $garde; // L'objet Garde concerné
        public $sender; // L'utilisateur qui initie l'action (ex: docteur qui envoie une garde, infirmier qui demande un échange)
        public $recipient_nurse; // L'infirmier destinataire de l'échange (si applicable)

        /**
         * Create a new notification instance.
         *
         * @param  string  $type_notification
         * @param  \App\Models\Garde  $garde
         * @param  \App\Models\User|null  $sender
         * @param  \App\Models\User|null  $recipient_nurse
         * @return void
         */
        public function __construct(string $type_notification, Garde $garde, ?User $sender = null, ?User $recipient_nurse = null)
        {
            $this->type_notification = $type_notification;
            $this->garde = $garde;
            $this->sender = $sender;
            $this->recipient_nurse = $recipient_nurse;
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
            $title = "Notification d'emploi du temps";
            $message = "Mise à jour de votre emploi du temps.";
            $icon = 'calendar'; // Icône par défaut

            $senderName = $this->sender ? "{$this->sender->prenom} {$this->sender->nom}" : "Un utilisateur";
            $nurseName = $this->garde->infirmier ? "{$this->garde->infirmier->prenom} {$this->garde->infirmier->nom}" : "un infirmier";
            $recipientNurseName = $this->recipient_nurse ? "{$this->recipient_nurse->prenom} {$this->recipient_nurse->nom}" : "un autre infirmier";

            switch ($this->type_notification) {
                case 'nouvelle_garde':
                    $title = "Nouvelle Garde Attribuée";
                    $message = "Dr. {$senderName} a envoyé une nouvelle garde pour le {$this->garde->date} à {$this->garde->heure_debut}.";
                    $icon = 'calendar-plus'; // Icône pour nouvelle garde
                    break;

                case 'garde_confirmee':
                    $title = "Garde Confirmée";
                    $message = "La garde de {$nurseName} pour le {$this->garde->date} à {$this->garde->heure_debut} a été confirmée.";
                    $icon = 'check-circle'; // Icône pour garde confirmée
                    break;

                case 'garde_refusee':
                    $title = "Garde Refusée";
                    $message = "La garde de {$nurseName} pour le {$this->garde->date} à {$this->garde->heure_debut} a été refusée.";
                    $icon = 'x-circle'; // Icône pour garde refusée
                    break;

                case 'demande_echange':
                    $title = "Demande d'Échange de Garde";
                    $message = "{$senderName} a demandé à échanger sa garde du {$this->garde->date} à {$this->garde->heure_debut} avec {$recipientNurseName}.";
                    $icon = 'refresh-cw'; // Icône pour échange
                    break;

                case 'echange_accepte':
                    $title = "Échange de Garde Accepté";
                    $message = "Votre demande d'échange de garde avec {$senderName} pour le {$this->garde->date} a été acceptée.";
                    $icon = 'check-circle';
                    break;

                case 'echange_refuse':
                    $title = "Échange de Garde Refusé";
                    $message = "Votre demande d'échange de garde avec {$senderName} pour le {$this->garde->date} a été refusée.";
                    $icon = 'x-circle';
                    break;
            }

            return [
                'type' => 'schedule_event',
                'event_type' => $this->type_notification,
                'garde_id' => $this->garde->id,
                'sender_id' => $this->sender ? $this->sender->id : null,
                'sender_name' => $this->sender ? "{$this->sender->prenom} {$this->sender->nom}" : null,
                'nurse_name' => $nurseName, // Nom de l'infirmier de la garde
                'recipient_nurse_name' => $this->recipient_nurse ? "{$this->recipient_nurse->prenom} {$this->recipient_nurse->nom}" : null, // Nom de l'infirmier destinataire de l'échange
                'garde_date' => $this->garde->date,
                'garde_heure_debut' => $this->garde->heure_debut,
                'title' => $title,
                'message' => $message,
                'icon' => $icon,
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
                'type' => 'schedule_event',
                'data' => $this->toArray($notifiable),
                'read_at' => null,
                'created_at' => now()->toDateTimeString(),
            ]);
        }
    }
