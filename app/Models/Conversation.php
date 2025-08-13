<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str; // Import pour générer l'UUID

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = ['uuid'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->uuid = (string) Str::uuid(); // Générer un UUID lors de la création
        });
    }

    // Une conversation a plusieurs messages
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    // Une conversation a plusieurs participants (utilisateurs)
    public function participants()
    {
        return $this->belongsToMany(User::class, 'conversation_participants', 'conversation_id', 'user_id')
                    ->withPivot('last_read_at')
                    ->withTimestamps();
    }
}