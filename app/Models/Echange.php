<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Echange extends Model
{
    use HasFactory;
    protected $fillable = [
        'demandeur_id',
        'cible_id',
        'date_origine',
        'date_cible',
        'motif',
        'statut'
    ];
    public function demandeur()
    {
        return $this->belongsTo(User::class, 'demandeur_id');
    }
    public function cible()
    {
        return $this->belongsTo(User::class, 'cible_id');
    }
}
