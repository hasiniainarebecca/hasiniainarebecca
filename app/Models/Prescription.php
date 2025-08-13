<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\PrescriptionMedication;
use App\Models\PrescriptionOrder;
use App\Models\User;

class Prescription extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'patient_id', 
        'doctor_id', 
        'notes', 
        'renewals', 
        'status'
    ];

    public function medications()
    {
        return $this->hasMany(PrescriptionMedication::class)->with('medication');
    }
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
    // Relation avec les ordres de prescription
    public function prescriptionOrders()
    {
        return $this->hasMany(PrescriptionOrder::class);
    }
}
