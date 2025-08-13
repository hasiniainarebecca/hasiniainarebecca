<?php

namespace App\Notifications;

use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class MessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $message;
    public $sender;

    /**
     * Create a new notification instance.
     *
     * @param  \App\Models\Message  $message
     * @param  \App\Models\User  $sender
     * @return void
     */
    public function __construct(Message $message, User $sender)
    {
        $this->message = $message;
        $this->sender = $sender;
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
            'type' => 'message',
            'message_id' => $this->message->id,
            'sender_id' => $this->sender->id,
            'sender_name' => $this->sender->nom . ' ' . $this->sender->prenom,
            'conversation_id' => $this->message->conversation_id,
            'body' => $this->message->body,
            'sent_at' => $this->message->created_at->toDateTimeString(),
            'title' => 'Nouveau message', // Titre pour le frontend
            'message' => "{$this->sender->nom} {$this->sender->prenom} vous a envoyé un message le {$this->message->created_at->format('d/m/Y')} à {$this->message->created_at->format('H:i')}",
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
            'type' => 'message',
            'data' => $this->toArray($notifiable),
            'read_at' => null,
            'created_at' => now()->toDateTimeString(),
        ]);
    }
}