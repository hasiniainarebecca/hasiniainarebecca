<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\ServiceRequest;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'nurse_id',
        'title',
        'type_professionnel',
        'description',
        'availability',
        'price',
    ];

    public function nurse()
    {
        return $this->belongsTo(User::class, 'nurse_id');
    }

    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class);
    }
}