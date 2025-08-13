<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class MedicalHistoryRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'year',
        'event',
    ];

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}