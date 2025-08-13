<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User; // Assurez-vous d'importer le modèle User
use App\Models\Etablissement;

class Garde extends Model
{
    use HasFactory;
    protected $fillable = [
        'infirmier_id',
        'service',
        'etablissement',
        'date',
        'heure_debut',
        'heure_fin',
        'statut',
        'type',
        'etablissement_id'
    ];

    public function infirmier()
    {
        return $this->belongsTo(User::class, 'infirmier_id');
    }
    public function etablissement()
    {
        return $this->belongsTo(Etablissement::class);
    }
}
