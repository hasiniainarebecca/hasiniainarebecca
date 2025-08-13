<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\PatientDetail;
use Carbon\Carbon;

class NursePatientController extends Controller
{
    /**
     * Get the list of patients for the authenticated nurse.
     */
    public function index(Request $request)
    {
        $nurse = Auth::user();

        if ($nurse->role !== 'infirmier') {
            return response()->json(['message' => 'Accès refusé. Seuls les infirmiers peuvent accéder à cette liste.'], 403);
        }

        $patientIds = $nurse->receivedServiceRequests()
                             ->pluck('patient_id')
                             ->unique();

        $patients = User::whereIn('id', $patientIds)
                        ->where('role', 'patient')
                        ->with(['patientDetail', 'medicalHistoryRecords', 'patientExams', 'patientServiceRequests']) // Charger les relations ici, y compris patientServiceRequests
                        ->get();

        $transformedPatients = $patients->map(function ($patient) use ($nurse) {
            $lastServiceRequest = $patient->patientServiceRequests()
                                          ->where('nurse_id', $nurse->id)
                                          ->latest('requested_date')
                                          ->first();

            $nextServiceRequest = $patient->patientServiceRequests()
                                          ->where('nurse_id', $nurse->id)
                                          ->whereIn('status', ['en attente', 'planifié'])
                                          ->oldest('requested_date')
                                          ->first();

            $age = 'N/A';
            // Corrigez ici pour utiliser $patient->date_naissance qui est dans le modèle User
            if ($patient->date_naissance) {
                try {
                    $age = Carbon::parse($patient->date_naissance)->diffInYears(Carbon::now());
                } catch (\Exception $e) {
                    \Log::error('Error parsing date_naissance for patient ' . $patient->id . ': ' . $e->getMessage());
                }
            }

            $medicalHistory = $patient->medicalHistoryRecords->map(function ($record) {
                return [
                    // Assurez-vous que 'year' est bien une date stockée ou une année seulement
                    'date' => Carbon::parse($record->year)->format('d/m/Y'),
                    'description' => $record->event,
                    'type' => 'Historique Médical',
                    'professional' => 'N/A'
                ];
            })->toArray();

            $patientExams = $patient->patientExams->map(function ($exam) {
                return [
                    'date' => Carbon::parse($exam->date)->format('d/m/Y'),
                    'type' => $exam->type,
                    'result' => $exam->result,
                    'file' => $exam->file,
                ];
            })->toArray();

            return [
                'id' => $patient->id,
                'name' => $patient->prenom . ' ' . $patient->nom,
                'avatar' => strtoupper(substr($patient->prenom, 0, 1) . substr($patient->nom, 0, 1)),
                'age' => $age,
                'gender' => $patient->sexe ?? 'N/A',
                'address' => $patient->patientDetail ? $patient->patientDetail->address : 'N/A',
                'phone' => $patient->phone,
                'email' => $patient->email,
                'bloodType' => $patient->patientDetail ? $patient->patientDetail->bloodType : 'N/A',
                'allergies' => $patient->patientDetail ? $patient->patientDetail->allergies : 'Aucune',
                'chronicConditions' => $patient->patientDetail ? $patient->patientDetail->chronicConditions : 'Aucune',
                'lastVisit' => $lastServiceRequest ? $lastServiceRequest->requested_date->format('d/m/Y') : 'N/A',
                'nextAppointment' => $nextServiceRequest ? ($nextServiceRequest->requested_date->format('d/m/Y') . ' - ' . ($nextServiceRequest->requested_time ? Carbon::parse($nextServiceRequest->requested_time)->format('H:i') : 'Heure à confirmer')) : 'Aucun',
                'medicalHistory' => $medicalHistory,
                'patientExams' => $patientExams,
                // 'currentMedications' n'existe pas dans PatientDetail selon les fichiers fournis.
                // Il faut soit l'ajouter au modèle PatientDetail, soit le récupérer d'une autre source (ex: Prescription).
                // Pour l'instant, je le laisse comme 'Aucun' pour éviter une erreur.
                'medications' => $patient->patientDetail ? ($patient->patientDetail->currentMedications ?? 'Aucun') : 'Aucun',
                'notes' => 'Suivi régulier par l\'infirmier(e) ' . $nurse->prenom . ' ' . $nurse->nom . '.',
            ];
        });

        return response()->json($transformedPatients);
    }

    /**
     * Display the specified patient's details for the modal.
     */
public function show($patientId)
    {
        $nurse = Auth::user();

        if ($nurse->role !== 'infirmier') {
            return response()->json(['message' => 'Accès refusé. Seuls les infirmiers peuvent accéder à ce dossier.'], 403);
        }

        $patient = User::where('id', $patientId)
                       ->where('role', 'patient')
                       ->with('patientDetail', 'medicalHistoryRecords', 'patientExams', 'patientServiceRequests')
                       ->first();

        if (!$patient) {
            return response()->json(['message' => 'Patient non trouvé.'], 404);
        }

        $hasServiceRequests = $patient->patientServiceRequests()
                                      ->where('nurse_id', $nurse->id)
                                      ->exists();

        if (!$hasServiceRequests) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à voir le dossier de ce patient car il n\'a pas de requêtes de service avec vous.'], 403);
        }

        // Calcul de l'âge
        $age = 'N/A';
        if ($patient->date_naissance) {
            $age = Carbon::parse($patient->date_naissance)->age;
        }

        // Formatage de l'historique médical
        $medicalHistory = $patient->medicalHistoryRecords->map(function ($record) {
            return [
                'year' => $record->year,
                'event' => $record->event,
            ];
        });

        // Formatage des examens du patient (CORRECTION ICI !)
        $patientExams = $patient->patientExams->map(function ($exam) {
            $filenameOnly = basename($exam->file); // Extrait juste le nom du fichier

            return [
                'date' => Carbon::parse($exam->date)->format('d/m/Y'),
                'type' => $exam->type,
                'result' => $exam->result,
                'file' => $filenameOnly, // Envoyer UNIQUEMENT le nom du fichier au frontend
            ];
        });

        // Récupérer la dernière et la prochaine requête de service
        $lastServiceRequest = $patient->patientServiceRequests()
                                      ->where('nurse_id', $nurse->id)
                                      ->latest('requested_date')
                                      ->first();

        $nextServiceRequest = $patient->patientServiceRequests()
                                      ->where('nurse_id', $nurse->id)
                                      ->whereIn('status', ['en attente', 'planifié'])
                                      ->oldest('requested_date')
                                      ->first();

        $transformedPatient = [
            'id' => $patient->id,
            'name' => $patient->prenom . ' ' . $patient->nom,
            'avatar' => strtoupper(substr($patient->prenom, 0, 1) . substr($patient->nom, 0, 1)),
            'age' => $age,
            'gender' => $patient->sexe ?? 'N/A',
            'address' => $patient->patientDetail ? $patient->patientDetail->address : 'N/A',
            'phone' => $patient->phone,
            'email' => $patient->email,
            'bloodType' => $patient->patientDetail ? $patient->patientDetail->bloodType : 'N/A',
            'allergies' => $patient->patientDetail ? $patient->patientDetail->allergies : 'Aucune',
            'chronicConditions' => $patient->patientDetail ? $patient->patientDetail->chronicConditions : 'Aucune',
            'lastVisit' => $lastServiceRequest ? $lastServiceRequest->requested_date->format('d/m/Y') : 'N/A',
            'nextAppointment' => $nextServiceRequest ? ($nextServiceRequest->requested_date->format('d/m/Y') . ' - ' . ($nextServiceRequest->requested_time ? Carbon::parse($nextServiceRequest->requested_time)->format('H:i') : 'Heure à confirmer')) : 'Aucun',
            'medicalHistory' => $medicalHistory,
            'patientExams' => $patientExams, // Contient maintenant uniquement les noms de fichiers
            'medications' => $patient->patientDetail ? ($patient->patientDetail->currentMedications ?? 'Aucun') : 'Aucun',
            'notes' => 'Suivi régulier par l\'infirmier ' . $nurse->prenom . ' ' . $nurse->nom . '.',
        ];

        return response()->json($transformedPatient);
    }
}