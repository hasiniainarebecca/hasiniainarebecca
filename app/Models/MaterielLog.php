<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Materiel;
use App\Models\User;

class MaterielLog extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id', 'materiel_id', 'quantity_added', 'notes'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function materiel()
    {
        return $this->belongsTo(Materiel::class);
    }
}
