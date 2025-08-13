<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class PatientExam extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'date',
        'type',
        'result',
        'file',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}