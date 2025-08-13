<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\Pharmacie;
use App\Models\Medication;

class Commande extends Model
{
    use HasFactory;
    protected $fillable = [
        'patient_id',
        'pharmacy_id',
        'pharmacien_id',
        'medication_id',
        'quantity',
        'prix_total',
        'status',
        'note',
    ];

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
    public function pharmacie()
    {
        return $this->belongsTo(Pharmacie::class, 'pharmacy_id');
    }
    public function pharmacien()
    {
        return $this->belongsTo(User::class, 'pharmacien_id');
    }
    public function medication()
    {
        return $this->belongsTo(Medication::class, 'medication_id');
    }
}
