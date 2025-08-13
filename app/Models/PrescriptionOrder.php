<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Prescription;
use App\Models\Pharmacie;

class PrescriptionOrder extends Model
{
    use HasFactory;
    protected $fillable = ['prescription_id','pharmacy_id', 'patient_id', 'status', 'ordered_at','total_price'];

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
    public function pharmacy()
    {
        return $this->belongsTo(Pharmacie::class, 'pharmacy_id');
    }
}
