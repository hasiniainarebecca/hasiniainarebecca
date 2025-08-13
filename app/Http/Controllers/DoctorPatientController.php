<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Appointment;
use App\Models\User;
use App\Models\PatientDetail;
use App\Models\Prescription; // Assurez-vous d'importer le modèle Prescription
use App\Models\MedicalHistoryRecord; // Import the MedicalHistoryRecord model
use App\Models\PatientExam; // Import the PatientExam model

class DoctorPatientController extends Controller
{
    /**
     * Récupère la liste des patients pour le docteur authentifié.
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $doctor = Auth::user();

        if ($doctor->role !== 'docteur') {
            return response()->json(['message' => 'Accès refusé. Seuls les docteurs peuvent accéder à cette liste.'], 403);
        }

        $patientIds = Appointment::where('doctor_id', $doctor->id)
                                 ->pluck('patient_id')
                                 ->unique();

        $patients = User::whereIn('id', $patientIds)
                        ->where('role', 'patient')
                        ->with('patientDetail') // Eager load patient details for rich information if needed
                        ->get();

        $transformedPatients = $patients->map(function ($patient) use ($doctor) {
            // Calcul de la dernière consultation
            $lastConsultation = $patient->patientAppointments()
                                        ->where('doctor_id', $doctor->id)
                                        ->whereIn('status', ['confirmé', 'terminé'])
                                        ->where('appointment_date', '<', now())
                                        ->latest('appointment_date')
                                        ->first();

            $status = 'N/A';
            if ($lastConsultation) {
                if ($lastConsultation->appointment_date->diffInMonths(now()) <= 3) {
                    $status = 'Actif';
                } else {
                    $status = 'Inactif';
                }
            } else {
                $status = 'Nouveau';
            }

            $age = 'N/A';
            if ($patient->date_naissance) {
                $age = $patient->date_naissance->age;
            }
            
            return [
                'id' => $patient->id,
                'name' => $patient->prenom . ' ' . $patient->nom, // Nom complet
                'firstName' => $patient->prenom, // Pour compatibilité si besoin
                'lastName' => $patient->nom,     // Pour compatibilité si besoin
                'age' => $age,
                'gender' => $patient->sexe ?? 'N/A', 
                'lastConsultation' => $lastConsultation ? $lastConsultation->appointment_date->format('d/m/Y') : 'N/A',
                'status' => $status,
                'avatar' => strtoupper(substr($patient->prenom, 0, 1) . substr($patient->nom, 0, 1)),
                // Ajoutez les champs du patient directement ici pour un accès facile si nécessaire dans DoctorPatientList
                'email' => $patient->email,
                'phone' => $patient->phone,
                'date_naissance' => $patient->date_naissance ? $patient->date_naissance->format('Y-m-d') : null, // Pour calculateAge dans DoctorPatientDetails
                'address' => $patient->patientDetail->address ?? 'N/A',
                'bloodType' => $patient->patientDetail->bloodType ?? 'N/A',
                'allergies' => $patient->patientDetail->allergies ? explode(', ', $patient->patientDetail->allergies) : [],
                'chronicConditions' => $patient->patientDetail->chronicConditions ? explode(', ', $patient->patientDetail->chronicConditions) : [],
                'medical_history' => $patient->medical_history, // Directement depuis le modèle User
            ];
        });

        if ($request->has('searchTerm') && !empty($request->searchTerm)) {
            $searchTerm = strtolower($request->searchTerm);
            $transformedPatients = $transformedPatients->filter(function ($patient) use ($searchTerm) {
                return str_contains(strtolower($patient['name']), $searchTerm);
            })->values();
        }

        return response()->json($transformedPatients);
    }

    /**
     * Récupère les informations médicales détaillées pour un patient spécifique.
     * @param int $patientId
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($patientId)
    {
        $doctor = Auth::user();

        if ($doctor->role !== 'docteur') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $patient = User::where('id', $patientId)
                       ->where('role', 'patient')
                       // Charger patientDetail, appointments, prescriptions et leurs médicaments
                       ->with([
                           'patientDetail',
                           'patientAppointments' => function($query) {
                               $query->orderBy('appointment_date', 'desc'); // Ordonner les rendez-vous
                           },
                           'prescriptions' => function($query) {
                               $query->where('status', 'envoyé') // Filtrer uniquement les ordonnances envoyées
                                     ->orderBy('created_at', 'desc') // Prendre la plus récente
                                     ->with('medications'); // Charger les médicaments pour chaque prescription
                           },
                           'medicalHistoryRecords', // Eager load medical history records
                           'patientExams' // Eager load patient exams
                       ])
                       ->first();

        if (!$patient) {
            return response()->json(['message' => 'Patient non trouvé.'], 404);
        }

        // Vérifier si le docteur a déjà eu un rendez-vous avec ce patient
        $hasAppointment = Appointment::where('doctor_id', $doctor->id)
                                     ->where('patient_id', $patientId)
                                     ->exists();

        if (!$hasAppointment) {
            return response()->json(['message' => 'Accès refusé. Ce patient n\'a pas de rendez-vous avec vous.'], 403);
        }

        $age = 'N/A';
        if ($patient->date_naissance) {
            $age = $patient->date_naissance->age;
        }

        $lastDoctorAppointment = $patient->patientAppointments()
                                         ->where('doctor_id', $doctor->id)
                                         ->whereIn('status', ['confirmé', 'terminé'])
                                         ->where('appointment_date', '<', now())
                                         ->latest('appointment_date')
                                         ->first();
        $lastVisit = $lastDoctorAppointment ? $lastDoctorAppointment->appointment_date->format('d/m/Y') : 'N/A';

        $nextDoctorAppointment = $patient->patientAppointments()
                                         ->where('doctor_id', $doctor->id)
                                         ->whereIn('status', ['en attente', 'confirmé'])
                                         ->where('appointment_date', '>=', now())
                                         ->oldest('appointment_date')
                                         ->first();
        $nextAppointment = $nextDoctorAppointment ? $nextDoctorAppointment->appointment_date->format('d/m/Y') . ' - ' . $nextDoctorAppointment->appointment_time->format('H:i') : 'N/A';

        // Collecter les consultations réelles du patient avec ce docteur
        $actualConsultations = $patient->patientAppointments()
                                    ->where('doctor_id', $doctor->id)
                                    ->whereIn('status', ['terminé', 'confirmé'])
                                    ->orderBy('appointment_date', 'desc')
                                    ->get()
                                    ->map(function($appt) {
                                        return [
                                            'date' => $appt->appointment_date->format('d/m/Y'),
                                            'reason' => $appt->reason,
                                            // Ajoutez ici les champs spécifiques aux consultations si disponibles dans le modèle Appointment
                                            'diagnosis' => 'À remplir', 
                                            'notes' => 'À remplir', 
                                        ];
                                    })->toArray();
        
        // Récupérer et transformer TOUTES les ordonnances du patient pour l'onglet "Ordonnances"
        $patientPrescriptions = $patient->prescriptions->map(function ($prescription) {
            return [
                'id' => $prescription->id,
                'date' => $prescription->created_at->format('d/m/Y'), // Date de création de l'ordonnance
                'notes' => $prescription->notes,
                'status' => $prescription->status,
                'renewals' => $prescription->renewals,
                'medications' => $prescription->medications->map(function ($medication) {
                    return [
                        'id' => $medication->id,
                        'medication_name' => $medication->medication_name,
                        'dosage' => $medication->dosage,
                        'frequency' => $medication->frequency,
                        'duration' => $medication->duration,
                    ];
                })->toArray(),
            ];
        })->toArray();

        // Trouver la dernière ordonnance "envoyée" et ses médicaments pour "Médicaments Actuels"
        $latestSentPrescription = $patient->prescriptions->first(); // Grâce au orderBy('created_at', 'desc') et where('status', 'envoyé') dans le with()

        $currentMedications = [];
        if ($latestSentPrescription && $latestSentPrescription->medications->isNotEmpty()) {
            $currentMedications = $latestSentPrescription->medications->pluck('medication_name')->toArray();
        }

        // Transformer les données d'historique médical
        $medicalHistoryData = $patient->medicalHistoryRecords->map(function ($record) {
            return [
                'id' => $record->id,
                'year' => $record->year,
                'event' => $record->event,
            ];
        })->toArray();

        // Transformer les données d'examens patient
        $patientExamsData = $patient->patientExams->map(function ($exam) {
            return [
                'id' => $exam->id,
                'date' => $exam->date->format('d/m/Y'),
                'type' => $exam->type,
                'result' => $exam->result,
                'file' => $exam->file, // Assuming 'file' stores the file name or path
            ];
        })->toArray();

        // Transformation des données pour correspondre au frontend DoctorPatientDetails.jsx
        $patientData = [
            'id' => $patient->id,
            'name' => $patient->prenom . ' ' . $patient->nom,
            'firstName' => $patient->prenom, 
            'lastName' => $patient->nom,     
            'dateOfBirth' => $patient->date_naissance ? $patient->date_naissance->format('Y-m-d') : null, 
            'age' => $age,
            'gender' => $patient->sexe ?? 'N/A',
            'address' => $patient->patientDetail->address ?? 'N/A',
            'phone' => $patient->phone ?? 'N/A', 
            'email' => $patient->email ?? 'N/A', 
            'bloodType' => $patient->patientDetail->bloodType ?? 'N/A',
            'allergies' => $patient->patientDetail->allergies ? explode(', ', $patient->patientDetail->allergies) : [],
            'chronicConditions' => $patient->patientDetail->chronicConditions ? explode(', ', $patient->patientDetail->chronicConditions) : [],
            'currentMedications' => $currentMedications, // Utilisation du tableau des noms de médicaments de la dernière ordonnance
            'lastVisit' => $lastVisit,
            'nextAppointment' => $nextAppointment,

            'consultations' => $actualConsultations,
            'prescriptions' => $patientPrescriptions, // Les données d'ordonnances réelles
            'exams' => $patientExamsData, // Utilisation des vraies données d'examens
            'medicalHistory' => $medicalHistoryData, // Utilisation des vraies données d'historique médical
        ];

        return response()->json($patientData);
    }
}