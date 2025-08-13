<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'patient_id',
        'doctor_id',
        'appointment_date',
        'appointment_time',
        'type',
        'reason',
        'status',
        'conference_id', 
        'call_started'   
    ];
    protected $casts = [
        'appointment_date' => 'date',
        'appointment_time' => 'datetime',
        'call_started' => 'boolean',
    ];

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}
