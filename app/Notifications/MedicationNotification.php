<?php

namespace App\Notifications;

use App\Models\Medication; // Assurez-vous d'importer le modèle Medication
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Carbon\Carbon;

class MedicationNotification extends Notification
{
    use Queueable;

    public $type_notification; // 'medicament_ajoute', 'medicament_modifie', 'medicament_supprime', 'stock_faible', 'date_expiration_proche'
    public $medicament; // L'objet Medication concerné
    public $sender; // L'utilisateur (pharmacien) qui initie l'action
    public $quantity_change; // Quantité utilisée/ajoutée (si applicable)

    /**
     * Create a new notification instance.
     *
     * @param  string  $type_notification
     * @param  \App\Models\Medication  $medicament
     * @param  \App\Models\User|null  $sender
     * @param  int|null  $quantity_change
     * @return void
     */
    public function __construct(string $type_notification, Medication $medicament, ?User $sender = null, ?int $quantity_change = null)
    {
        $this->type_notification = $type_notification;
        $this->medicament = $medicament;
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
        $title = "Notification Médicament";
        $message = "Mise à jour du stock de médicament.";
        $icon = 'pill'; // Icône par défaut (vous pouvez ajuster dans le frontend)

        $senderName = $this->sender ? "{$this->sender->prenom} {$this->sender->nom}" : "Un pharmacien";
        $medicamentName = $this->medicament->name;

        switch ($this->type_notification) {
            case 'medicament_ajoute':
                $title = "Nouveau Médicament Ajouté";
                $message = "{$senderName} a ajouté {$this->quantity_change} de {$medicamentName} au stock. Stock actuel: {$this->medicament->stock}.";
                $icon = 'plus-circle';
                break;

            case 'medicament_modifie':
                $title = "Médicament Modifié";
                $message = "{$senderName} a modifié les détails de {$medicamentName}. Stock actuel: {$this->medicament->stock}.";
                $icon = 'edit';
                break;

            case 'medicament_supprime':
                $title = "Médicament Supprimé";
                $message = "{$senderName} a supprimé {$medicamentName} du stock de médicaments.";
                $icon = 'trash-2';
                break;

            case 'stock_faible':
                $title = "Stock Faible : {$medicamentName}";
                $message = "Le stock de {$medicamentName} est faible ({$this->medicament->stock} restants). Veuillez réapprovisionner.";
                $icon = 'alert-triangle';
                break;

            case 'date_expiration_proche':
                $expiryDate = Carbon::parse($this->medicament->expiry_date)->format('d/m/Y');
                $title = "Date d'Expiration Proche : {$medicamentName}";
                $message = "La date d'expiration de {$medicamentName} est proche ({$expiryDate}). Veuillez trouver une solution.";
                $icon = 'calendar-x'; // Ou une autre icône pour l'expiration
                break;
        }

        return [
            'type' => 'medicament_event', // Important pour le filtrage côté frontend
            'event_type' => $this->type_notification,
            'medicament_id' => $this->medicament->id,
            'medicament_name' => $medicamentName,
            'sender_id' => $this->sender ? $this->sender->id : null,
            'sender_name' => $senderName,
            'quantity_change' => $this->quantity_change,
            'current_stock' => $this->medicament->stock, // Envoyer le stock actuel
            'min_stock' => $this->medicament->threshold, // Envoyer le seuil
            'expiry_date' => $this->medicament->expiry_date,
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
            'type' => 'medicament_event',
            'data' => $this->toArray($notifiable),
            'read_at' => null,
            'created_at' => now()->toDateTimeString(),
        ]);
    }
}
