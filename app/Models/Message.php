<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
    ];

    // Un message appartient à une conversation
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    // Un message est envoyé par un utilisateur (expéditeur)
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}