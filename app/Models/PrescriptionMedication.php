<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Medication;
use App\Models\Prescription;

class PrescriptionMedication extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'medication_name',
        'dosage',
        'frequency',
        'duration',
    ];
    public function medication()
    {
        return $this->belongsTo(Medication::class);
    }
    public function prescription() 
    {
        return $this->belongsTo(Prescription::class);
    }
}
