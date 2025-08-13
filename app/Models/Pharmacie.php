<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Medication;

class Pharmacie extends Model
{
    use HasFactory;
    protected $fillable = ['nom', 'adresse', 'horaires', 'type', 'verifie', 'has_delivery'];
    protected $appends = ['isOpen'];
    
    public function pharmaciens()
    {
        return $this->hasMany(User::class);
    }
        public function medications()
    {
        return $this->hasMany(Medication::class, 'pharmacy_id');
    }
    public function getIsOpenAttribute()
    {
        if (!$this->horaires || !str_contains($this->horaires, '-')) {
            return false;
        }

        [$start, $end] = explode('-', $this->horaires);

        try {
            $now = Carbon::now();
            $startTime = Carbon::createFromFormat('H:i', trim($start));
            $endTime = Carbon::createFromFormat('H:i', trim($end));

            return $now->between($startTime, $endTime);
        } catch (\Exception $e) {
            return false;
        }
    }
}
