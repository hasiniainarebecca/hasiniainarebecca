<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Pharmacie; 
use Carbon\Carbon;

class Medication extends Model
{
    use HasFactory;
    protected $fillable = [
        'pharmacy_id',
        'name',
        'category',
        'price',
        'stock',
        'threshold',
        'supplier',
        'expiry_date'
    ];
    
    public function pharmacie()
    {
        return $this->belongsTo(Pharmacie::class, 'pharmacy_id');
    }

}
