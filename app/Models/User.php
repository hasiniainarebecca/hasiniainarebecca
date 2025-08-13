<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Pharmacie;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\Prescription;
use App\Models\PatientDetail;
use App\Models\PatientExam;
use App\Models\MedicalHistoryRecord;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;
    protected $fillable=[
        'nom',
        'prenom',
        'sexe', // Champ 'sexe' est déjà là pour le genre
        'email',
        'phone',
        'photo',
        'role',
        'password',
        'date_naissance', // Champ 'date_naissance' pour la date de naissance
        'medical_id',
        'medical_history',
        'emergency_contact',
        'speciality',
        'licence_number',
        'annee_experience',
        'cv',
        'disponibilite',
        'poste',
        'experience_year',
        'skills',
        'horaire',
        'diplome',
        'certification',
        'pharmacie_id',
        'etablissement_id',
        'is_available'
    ];

    /**
     * @var array Les attributs qui doivent être castés en types natifs.
     */
    protected $casts = [
        'date_naissance' => 'date', // Convertit automatiquement 'date_naissance' en objet Carbon
    ];

    /**
     * Une relation avec les rendez-vous où cet utilisateur est le DOCTEUR.
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function doctorAppointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    /**
     * Pour les rendez-vous pris par le patient.
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function patientAppointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function pharmacie()
    {
        return $this->belongsTo(Pharmacie::class, 'pharmacie_id');
    }
    public function etablissement()
    {
        return $this->belongsTo(Etablissement::class);
    }
    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }
    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants', 'user_id', 'conversation_id')
                    ->withPivot('last_read_at')
                    ->withTimestamps();
    }
    public function offeredServices()
    {
        return $this->hasMany(Service::class, 'nurse_id');
    }

    public function sentServiceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'patient_id');
    }

    public function receivedServiceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'nurse_id');
    }
    public function patientDetail(): HasOne
    {
        return $this->hasOne(PatientDetail::class, 'patient_id');
    }
    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }

    public function medicalHistoryRecords()
    {
        return $this->hasMany(MedicalHistoryRecord::class, 'patient_id');
    }

    public function patientExams()
    {
        return $this->hasMany(PatientExam::class, 'patient_id');
    }
    public function nurseServiceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'nurse_id');
    }
    public function patientServiceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'patient_id');
    }
     public function appointmentsAsPatient()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function appointmentsAsDoctor()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }
}
