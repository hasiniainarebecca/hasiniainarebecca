<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Etablissement;
use App\Models\MaterielLog;

class Materiel extends Model
{
    use HasFactory;
    protected $fillable = [
        'name', 'category', 'current_stock', 'min_stock', 'unit',
        'location', 'expiry_date', 'supplier', 'etablissement_id'
    ];

    protected $casts = [
        'expiry_date' => 'date',
    ];

    public function etablissement()
    {
        return $this->belongsTo(Etablissement::class);
    }

    public function logs()
    {
        return $this->hasMany(MaterielLog::class);
    }
}
