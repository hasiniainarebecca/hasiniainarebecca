<?php

namespace App\Notifications;

use App\Models\Materiel;
    use App\Models\User;
    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Notifications\Notification;
    use Illuminate\Notifications\Messages\BroadcastMessage;
    use Carbon\Carbon;

    class MaterielNotification extends Notification implements ShouldQueue
    {
        use Queueable;

        public $type_notification; // 'materiel_utilise', 'materiel_supprime', 'materiel_modifie', 'materiel_ajoute', 'stock_faible'
        public $materiel; // L'objet Materiel concerné
        public $sender; // L'utilisateur qui initie l'action
        public $quantity_change; // Quantité utilisée/ajoutée (si applicable)

        /**
         * Create a new notification instance.
         *
         * @param  string  $type_notification
         * @param  \App\Models\Materiel  $materiel
         * @param  \App\Models\User|null  $sender
         * @param  int|null  $quantity_change
         * @return void
         */
        public function __construct(string $type_notification, Materiel $materiel, ?User $sender = null, ?int $quantity_change = null)
        {
            $this->type_notification = $type_notification;
            $this->materiel = $materiel;
            $this->sender = $sender;
            $this->quantity_change = $quantity_change;
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
            $title = "Notification Matériel Médical";
            $message = "Mise à jour du stock de matériel.";
            $icon = 'package'; // Icône par défaut

            $senderName = $this->sender ? "{$this->sender->prenom} {$this->sender->nom}" : "Un utilisateur";
            $materielName = $this->materiel->name;

            switch ($this->type_notification) {
                case 'materiel_utilise':
                    $title = "Matériel Utilisé";
                    $message = "{$senderName} a utilisé {$this->quantity_change} {$this->materiel->unit} de {$materielName}. Stock actuel: {$this->materiel->current_stock}.";
                    $icon = 'minus-circle';
                    break;

                case 'materiel_supprime':
                    $title = "Matériel Supprimé";
                    $message = "{$senderName} a supprimé {$materielName} du stock de matériel.";
                    $icon = 'trash-2'; // Ou 'x-circle'
                    break;

                case 'materiel_modifie':
                    $title = "Matériel Modifié";
                    $message = "{$senderName} a modifié les détails de {$materielName}.";
                    $icon = 'edit';
                    break;

                case 'materiel_ajoute':
                    $title = "Nouveau Matériel Ajouté";
                    $message = "{$senderName} a ajouté {$this->quantity_change} {$this->materiel->unit} de {$materielName} au stock. Stock actuel: {$this->materiel->current_stock}.";
                    $icon = 'plus-circle';
                    break;

                case 'stock_faible':
                    $title = "Stock Faible : {$materielName}";
                    $message = "Le stock de {$materielName} est faible ({$this->materiel->current_stock} {$this->materiel->unit} restants). Veuillez réapprovisionner.";
                    $icon = 'alert-triangle';
                    break;
            }

            return [
                'type' => 'materiel_event',
                'event_type' => $this->type_notification,
                'materiel_id' => $this->materiel->id,
                'materiel_name' => $materielName,
                'sender_id' => $this->sender ? $this->sender->id : null,
                'sender_name' => $senderName,
                'quantity_change' => $this->quantity_change,
                'current_stock' => $this->materiel->current_stock,
                'min_stock' => $this->materiel->min_stock,
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
                'type' => 'materiel_event',
                'data' => $this->toArray($notifiable),
                'read_at' => null,
                'created_at' => now()->toDateTimeString(),
            ]);
        }
    }
