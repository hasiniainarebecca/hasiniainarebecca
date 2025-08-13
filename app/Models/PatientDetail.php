<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientDetail extends Model
{
    use HasFactory;
    protected $fillable = [
        'patient_id',
        'address',
        'bloodType',
        'allergies',
        'chronicConditions',
    ];
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}
