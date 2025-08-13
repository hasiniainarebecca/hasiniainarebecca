<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Service;


class ServiceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'patient_id',
        'nurse_id',
        'requested_date',
        'requested_time',
        'reason',
        'status',
    ];

    protected $casts = [
        'requested_date' => 'date',
        'requested_time' => 'datetime:H:i:s', // Carbon instance for time
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function nurse()
    {
        return $this->belongsTo(User::class, 'nurse_id');
    }
}