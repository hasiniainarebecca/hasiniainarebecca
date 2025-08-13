<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\PatientDetail;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\MedicalHistoryRecord;
use App\Models\PatientExam; // Ensure this is imported
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage; // NOUVEAU: Ajoutez ceci pour la gestion du stockage
use App\Notifications\PatientProfileUpdatedNotification;

class PatientProfileController extends Controller
{
    /**
     * Helper method to get formatted patient profile data.
     * @param User $user
     * @return array
     */
    private function _getPatientProfileData(User $user): array
    {
        // Ensure patientDetail, medicalHistoryRecords, and patientExams are loaded
        $user->load(['patientDetail', 'medicalHistoryRecords', 'patientExams']);
        $patientDetail = $user->patientDetail;

        // Ensure chronicConditions is a string, even if null
        $chronicConditions = $patientDetail ? ($patientDetail->chronicConditions ?? '') : '';

        // Fetch Current Medications (latest prescriptions)
        $currentMedications = [];
        $latestPrescription = Prescription::where('patient_id', $user->id)
            ->latest()
            ->with('medications')
            ->first();

        if ($latestPrescription && $latestPrescription->medications) {
            $currentMedications = $latestPrescription->medications->pluck('medication_name')->toArray();
        }

        // Fetch Last Visit (last completed appointment)
        $lastVisit = null;
        $latestCompletedAppointment = Appointment::where('patient_id', $user->id)
            ->where('status', 'terminé')
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->with('doctor') // Load the doctor to get their name
            ->first();

        if ($latestCompletedAppointment) {
            $lastVisit = [
                'date' => Carbon::parse($latestCompletedAppointment->appointment_date)->format('d/m/Y'),
                'time' => Carbon::parse($latestCompletedAppointment->appointment_time)->format('H:i'),
                'doctor' => $latestCompletedAppointment->doctor->nom . ' ' . $latestCompletedAppointment->doctor->prenom,
                'type' => $latestCompletedAppointment->type,
                'reason' => $latestCompletedAppointment->reason,
            ];
        }

        // Fetch Next Appointment (earliest upcoming confirmed/accepted appointment)
        $nextAppointment = null;
        $now = Carbon::now();

        $nextUpcomingAppointment = Appointment::where('patient_id', $user->id)
            ->whereIn('status', ['confirmé', 'accepté'])
            ->where(function ($query) use ($now) {
                $query->where('appointment_date', '>', $now->toDateString())
                      ->orWhere(function ($query) use ($now) {
                          $query->where('appointment_date', '=', $now->toDateString())
                                ->where('appointment_time', '>', $now->toTimeString());
                      });
            })
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->with('doctor') // Load the doctor to get their name
            ->first();

        if ($nextUpcomingAppointment) {
            $nextAppointment = [
                'date' => Carbon::parse($nextUpcomingAppointment->appointment_date)->format('d/m/Y'),
                'time' => Carbon::parse($nextUpcomingAppointment->appointment_time)->format('H:i'),
                'doctor' => $nextUpcomingAppointment->doctor->nom . ' ' . $nextUpcomingAppointment->doctor->prenom,
                'type' => $nextUpcomingAppointment->type,
                'reason' => $nextUpcomingAppointment->reason,
                'status' => $nextUpcomingAppointment->status,
            ];
        }

        // Prepare medical history for the frontend
        $medicalHistory = $user->medicalHistoryRecords->map(function ($record) {
            return [
                'year' => $record->year,
                'event' => $record->event,
            ];
        })->toArray();

        // Prepare exams for the frontend
        $exams = $user->patientExams->map(function ($exam) {
            return [
                'id' => $exam->id,
                'date' => Carbon::parse($exam->date)->format('d/m/Y'),
                'type' => $exam->type,
                'result' => $exam->result,
                'file' => $exam->file, // Ensure the file path/name is returned (e.g., private_exams/filename.pdf)
            ];
        })->toArray();

        return [
            'id' => $user->id,
            'firstName' => $user->nom, // Match frontend state 'firstName'
            'lastName' => $user->prenom, // Match frontend state 'lastName'
            'dateOfBirth' => $user->date_naissance,
            'gender' => $user->sexe, // Match frontend state 'gender'
            'address' => $patientDetail ? $patientDetail->address : null,
            'phone' => $user->phone,
            'email' => $user->email,
            'bloodType' => $patientDetail ? $patientDetail->bloodType : null,
            'allergies' => $patientDetail ? ($patientDetail->allergies ?? '') : '',
            'chronicConditions' => $chronicConditions,
            'currentMedications' => $currentMedications,
            'lastVisit' => $lastVisit,
            'nextAppointment' => $nextAppointment,
            'medicalHistory' => $medicalHistory, // La clé doit être 'medicalHistory'
            'exams' => $exams, // Match frontend 'exams'
        ];
    }

    /**
     * Get the authenticated patient's profile.
     */
    public function show()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // Only patients can access their profile
        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Accès refusé. Seuls les patients peuvent accéder à leur profil.'], 403);
        }

        $patientData = $this->_getPatientProfileData($user);

        // Retourne directement les données du patient sans clé 'patient' supplémentaire
        return response()->json($patientData);
    }

    /**
     * Update the authenticated patient's profile.
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'dateOfBirth' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20|unique:users,phone,' . $user->id,
            'bloodType' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'chronicConditions' => 'nullable|string',
            'medicalHistory' => 'nullable|array',
            'medicalHistory.*.year' => 'required_with:medicalHistory|integer|min:1900|max:' . (date('Y') + 1),
            'medicalHistory.*.event' => 'required_with:medicalHistory|string|max:1000',
            'exams' => 'nullable|array',
            'exams.*.date' => 'required_with:exams|date_format:d/m/Y', // Date format from frontend (JJ/MM/AAAA)
            'exams.*.type' => 'required_with:exams|string|max:255',
            'exams.*.result' => 'nullable|string|max:1000',
            // Validation pour un nouveau fichier uploadé
            'exams.*.file' => 'nullable|file|mimes:pdf|max:5000', // mimes:pdf pour PDF, max:5000 pour 5MB
            // Validation pour le nom de fichier existant (si aucun nouveau fichier n'est uploadé)
            'exams.*.existing_file' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::transaction(function () use ($request, $user) {
            // Update User model fields
            $user->nom = $request->input('firstName');
            $user->prenom = $request->input('lastName');
            $user->email = $request->input('email');
            $user->date_naissance = $request->input('dateOfBirth');
            $user->sexe = $request->input('gender');
            $user->phone = $request->input('phone');
            $user->save();

            // Update or create PatientDetail
            PatientDetail::updateOrCreate(
                ['patient_id' => $user->id],
                [
                    'address' => $request->input('address'),
                    'bloodType' => $request->input('bloodType'),
                    'allergies' => $request->input('allergies') ?? '',
                    'chronicConditions' => $request->input('chronicConditions') ?? '',
                ]
            );

            // Sync Medical History Records
            $user->medicalHistoryRecords()->delete();
            if ($request->has('medicalHistory') && is_array($request->input('medicalHistory'))) {
                foreach ($request->input('medicalHistory') as $recordData) {
                    $user->medicalHistoryRecords()->create([
                        'year' => $recordData['year'],
                        'event' => $recordData['event'],
                    ]);
                }
            }

            // Sync Patient Exams
            // Récupérer les examens existants pour gérer correctement les suppressions de fichiers
            $existingExams = $user->patientExams->keyBy('id');
            $filesToDelete = []; // Pour collecter les fichiers à supprimer physiquement

            // Identifier les fichiers à supprimer si les examens sont retirés ou si le fichier est remplacé
            if ($request->has('exams') && is_array($request->input('exams'))) {
                foreach ($existingExams as $examId => $existingExam) {
                    $foundInRequest = false;
                    $replacedFile = false;

                    foreach ($request->input('exams') as $index => $incomingExamData) {
                        if (isset($incomingExamData['id']) && $incomingExamData['id'] == $examId) {
                            $foundInRequest = true;
                            // Si un nouveau fichier est uploadé pour cet examen existant
                            if ($request->hasFile("exams.{$index}.file")) {
                                $replacedFile = true;
                            }
                            break;
                        }
                    }

                    // Si un examen existant n'est plus dans la requête ou si son fichier est remplacé,
                    // marquer l'ancien fichier pour suppression.
                    if (!$foundInRequest || $replacedFile) {
                        if ($existingExam->file && Storage::disk('local')->exists($existingExam->file)) {
                            $filesToDelete[] = $existingExam->file; // Ajoute le chemin relatif
                        }
                    }
                }
            } else {
                // Si aucun tableau 'exams' n'est envoyé (tous les examens sont supprimés),
                // marquer tous les fichiers existants pour suppression.
                foreach ($existingExams as $existingExam) {
                    if ($existingExam->file && Storage::disk('local')->exists($existingExam->file)) {
                        $filesToDelete[] = $existingExam->file;
                    }
                }
            }

            // Supprimer les enregistrements existants de la base de données avant de réinsérer
            $user->patientExams()->delete();

            // Supprimer physiquement les fichiers qui ne sont plus référencés
            foreach ($filesToDelete as $file) {
                Storage::disk('local')->delete($file);
            }

            // Réinsérer les examens mis à jour ou nouveaux
            if ($request->has('exams') && is_array($request->input('exams'))) {
                foreach ($request->input('exams') as $index => $examData) {
                    $fileNameToStore = null;

                    // GESTION DE L'UPLOAD DE FICHIER
                    if ($request->hasFile("exams.{$index}.file")) {
                        // C'est un nouveau fichier uploadé
                        $uploadedFile = $request->file("exams.{$index}.file");
                        $fileName = time() . '_' . preg_replace('/[^A-Za-z0-9.\-]/', '_', $uploadedFile->getClientOriginalName());
                        $path = $uploadedFile->storeAs('private_exams', $fileName);
                        $fileNameToStore = $path; // Chemin relatif du fichier stocké
                    } else if ($request->has("exams.{$index}.existing_file")) {
                        // Le frontend a envoyé un nom de fichier existant (pas un nouvel upload)
                        $existingFileName = $request->input("exams.{$index}.existing_file");
                        if (!empty($existingFileName)) {
                            // Reconstituer le chemin complet et vérifier son existence
                            $potentialExistingPath = 'private_exams/' . basename($existingFileName);
                            if (Storage::disk('local')->exists($potentialExistingPath)) {
                                $fileNameToStore = $potentialExistingPath;
                            } else {
                                // Si le nom de fichier existant envoyé par le frontend ne correspond pas à un fichier réel
                                // dans private_exams, on le considère comme nul.
                                $fileNameToStore = null;
                            }
                        }
                        // Si existing_file est vide, $fileNameToStore reste null, ce qui est correct
                    }
                    // Si rien n'est envoyé pour 'file' ou 'existing_file', $fileNameToStore reste null.

                    $user->patientExams()->create([
                        'date' => Carbon::createFromFormat('d/m/Y', $examData['date'])->format('Y-m-d'), // Laravel attend 'd/m/Y' pour la validation, mais stocke 'Y-m-d'
                        'type' => $examData['type'],
                        'result' => $examData['result'] ?? null,
                        'file' => $fileNameToStore, // Stocke le chemin relatif du fichier (e.g., private_exams/filename.pdf)
                    ]);
                }
            }
        });

        // Recharger l'utilisateur et les détails du patient pour s'assurer que les dernières données sont récupérées
        $user->refresh();

        
        // --- NOTIFICATION : Dossier patient mis à jour ---
        // Notifier les docteurs et infirmiers associés à ce patient (ou tous si pas de lien spécifique)
        // Pour simplifier, nous allons notifier tous les docteurs et infirmiers.
        // Dans un système réel, vous voudriez notifier seulement ceux qui ont un lien (rendez-vous passés, suivi, etc.)
        $doctors = User::where('role', 'docteur')->get();
        foreach ($doctors as $doctor) {
            $doctor->notify(new PatientProfileUpdatedNotification($user));
        }

        $nurses = User::where('role', 'infirmier')->get();
        foreach ($nurses as $nurse) {
            $nurse->notify(new PatientProfileUpdatedNotification($user));
        }
        // --- FIN NOTIFICATION ---


        // Obtenir les données de profil patient mises à jour en utilisant la méthode d'aide
        $updatedPatientData = $this->_getPatientProfileData($user);

        return response()->json(['message' => 'Profil mis à jour avec succès', 'patient' => $updatedPatientData]);
    }
}
