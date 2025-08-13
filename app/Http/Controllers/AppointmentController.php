<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use App\Notifications\RendezVousNotification;
 use App\Notifications\ConsultationNotification;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $appointments = Appointment::with('doctor')->where('patient_id', $user->id)->get();

        return response()->json($appointments);
    }


    public function getDoctors(Request $request)
    {// Vérifier que l'utilisateur est authentifié
            if (!auth()->check()) {
                return response()->json(['message' => 'Utilisateur non authentifié'], 401);
            }

            // Récupérer l'utilisateur connecté
            $user = auth()->user();

            // Vérifier si c'est un admin
            if ($user->role !== 'patient') {
                return response()->json(['message' => 'Accès refusé'], 403);
            }

            // Récupérer les docteurs
            $doctors = User::where('role', 'docteur')->get();
            return response()->json($doctors);
    }

    public function getDoctorPatients($doctorId)
    {
        // Vérifie que l'utilisateur connecté est bien un docteur
        if (Auth::user()->role !== 'docteur') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Récupérer les patients qui ont déjà eu un rendez-vous avec ce docteur
        $patients = Appointment::where('doctor_id', $doctorId)
                    ->where('status', '!=', 'annulé') // Optionnel : on exclut les rendez-vous annulés
                    ->with('patient')
                    ->get()
                    ->pluck('patient') // On récupère uniquement les patients
                    ->unique('id')     // Évite les doublons si plusieurs rendez-vous
                    ->values();        // Réindexe proprement

        return response()->json($patients);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'nullable|date_format:H:i',
            'type' => 'required|in:in-person,video',
            'reason' => 'nullable|string|max:1000'
        ]);

        $appointment = Appointment::create([
            'patient_id' => Auth::id(), // Patient connecté
            'doctor_id' => $request->doctor_id,
            'appointment_date' => $request->appointment_date,
            'appointment_time' => $request->appointment_time,
            'type' => $request->type,
            'reason' => $request->reason,
            'status' => 'en attente',
            'conference_id' => ($request->type === 'video') ? Str::uuid() : null, // Générer un UUID si type est 'video'
            'call_started' => false,
        ]);
        // Récupérer les instances complètes du patient et du docteur
        $patient = User::find($appointment->patient_id);
        $docteur = User::find($appointment->doctor_id);

        // Envoyer une notification au docteur
        if ($docteur) {
            $docteur->notify(new RendezVousNotification($appointment, 'reserve', null, $patient));
        }

        // Si c'est une consultation vidéo, envoyer une notification de rappel au patient et au docteur
        if ($appointment->type === 'video') {
            if ($patient) {
                $patient->notify(new ConsultationNotification($appointment, 'rappel', $docteur, $patient));
            }
            if ($docteur) {
                $docteur->notify(new ConsultationNotification($appointment, 'rappel', $docteur, $patient));
            }
        }

        return response()->json([
            'message'=> 'Rendez-vous enregistré avec succès',
            'appointment' => $appointment
        ], 201);
    }

    //récupérer les rendez-vous du patient connecté
    public function getPatientAppointments()
    {
        $appointments = Appointment::where('doctor_id',
        Auth::id())->with('patient')->get();
        if ($request->user()->role !== 'doctor') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        return response()->json($appointments);
    }

    public function getDoctorAppointments(Request $request)
    {
            
    
        $appointments = Appointment::where('doctor_id', Auth::id())
                        ->with('patient')
                        ->orderBy('appointment_date', 'asc')
                        ->get();
    
        return response()->json($appointments);
    }

    public function accept($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->status = 'confirmé';
        $appointment->save();

        // Récupérer les instances complètes du patient et du docteur
        $patient = User::find($appointment->patient_id);
        $docteur = User::find($appointment->doctor_id);

        // Envoyer une notification au patient
        if ($patient) {
            $patient->notify(new RendezVousNotification($appointment, 'accepte', $docteur, null));
        }

        return response()->json([
            'message' => 'Rendez-vous confirmé',
            'appointment' => $appointment,
        ]);
    }

    public function decline($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->status = 'annulé';
        $appointment->save();

        // Récupérer les instances complètes du patient et du docteur
        $patient = User::find($appointment->patient_id);
        $docteur = User::find($appointment->doctor_id);

        // Envoyer une notification au patient
        if ($patient) {
            $patient->notify(new RendezVousNotification($appointment, 'refuse', $docteur, null));
        }

        return response()->json([
            'message' => 'Rendez-vous refusé',
            'appointment' => $appointment,
        ]);
    }

    public function reschedule($id)
    {
        $appointment = Appointment::findOrFail($id);

        if ($appointment->status !== 'confirmé') {
            return response()->json(['error' => 'Le rendez-vous n’est pas confirmé.'], 400);
        }

        $appointment->status = 'en attente';
        $appointment->save();

        return response()->json(['message' => 'Rendez-vous reprogrammé avec succès.']);
    }

    public function complete(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        // Si déjà terminé, ne rien changer, mais retourner succès
        if ($appointment->status === 'terminé') {
            return response()->json(['message' => 'Rendez-vous déjà terminé', 'appointment' => $appointment], 200);
        }

        $appointment->status = 'terminé';
        $appointment->save();

        return response()->json($appointment);
    }
    
    //Mettre à jour le status d'un rendez-vous
    public function updateStatus(Request $request, $id)
    {
        $request -> validate([
            'status' => 'required|in:en attente,confirmé,annulé'
        ]);
        $appointment = Appointment::findOrFail($id);
        //Vérifiez si le docteur est bien le propriétaire du rendez-vous
        if(Auth::id() != $appointment->doctor_id){
            return response()->json(['error' => 'Accès refusé'], 403);
        }
        $appointment->status = $request->status;
        $appointment->save();
        return response()->json([
            'message' => 'Status mis à jour',
            'appointment' => $appointment
        ]);
    }

    public function getDoctorStats($doctorId)
    {
        // Vérifie que l'utilisateur connecté est bien un docteur et qu'il correspond à l'ID
        if (Auth::user()->role !== 'docteur' || Auth::id() != $doctorId) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $now = now(); // Date et heure actuelles

        // Nombre de consultations à venir
        $upcomingConsultationsCount = Appointment::where('doctor_id', $doctorId)
            ->where('status', 'confirmé') // Ou 'en attente' selon votre logique
            ->where(function ($query) use ($now) {
                $query->where('appointment_date', '>', $now->toDateString())
                      ->orWhere(function ($query) use ($now) {
                          $query->where('appointment_date', $now->toDateString())
                                ->where('appointment_time', '>=', $now->toTimeString());
                      });
            })
            ->count();

        // Nombre de patients actifs (patients uniques ayant eu des rendez-vous avec ce docteur)
        $activePatientsCount = Appointment::where('doctor_id', $doctorId)
            ->distinct('patient_id')
            ->count('patient_id');

        // Nombre d'ordonnances émises par ce docteur
        $prescriptionsIssuedCount = Prescription::where('doctor_id', $doctorId)->count();

        return response()->json([
            'upcoming_consultations_count' => $upcomingConsultationsCount,
            'active_patients_count' => $activePatientsCount,
            'prescriptions_issued_count' => $prescriptionsIssuedCount,
        ]);
    }

     // Nouvelle méthode pour récupérer les prochains rendez-vous du docteur
    public function getDoctorUpcomingAppointments($doctorId)
    {
        // Vérifie que l'utilisateur connecté est bien un docteur et qu'il correspond à l'ID
        if (Auth::user()->role !== 'docteur' || Auth::id() != $doctorId) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $now = now();

        $upcomingAppointments = Appointment::with('patient:id,nom,prenom')
            ->where('doctor_id', $doctorId)
            ->where('status', 'confirmé')
            ->where(function ($query) use ($now) {
                $query->where('appointment_date', '>', $now->toDateString())
                    ->orWhere(function ($query) use ($now) {
                        $query->where('appointment_date', $now->toDateString())
                                ->where('appointment_time', '>=', $now->toTimeString());
                    });
            })
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get()
            ->map(function ($appointment) {
                // Correction ici - utilisez seulement la date et l'heure séparément
                return [
                    'id' => $appointment->id,
                    'patient_name' => $appointment->patient->prenom . ' ' . $appointment->patient->nom,
                    'date' => $appointment->appointment_date,
                    'time' => $appointment->appointment_time,
                    'type' => $appointment->type,
                    'reason' => $appointment->reason,
                    'conference_id' => $appointment->conference_id,
                    'call_started' => $appointment->call_started,
                ];
            });

        return response()->json($upcomingAppointments);
    }

    // Nouvelle méthode pour récupérer les prochains rendez-vous d'un patient
    public function getPatientUpcomingAppointments($patientId)
    {
        // Vérifie que l'utilisateur connecté est bien le patient dont l'ID est passé en paramètre
        if (Auth::user()->role !== 'patient' || Auth::id() != $patientId) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $now = now(); // Date et heure actuelles

        $upcomingAppointments = Appointment::with('doctor:id,nom,prenom,speciality')
            ->where('patient_id', $patientId)
            ->where('status', 'confirmé')
            ->where(function ($query) use ($now) {
                $query->where('appointment_date', '>', $now->toDateString())
                    ->orWhere(function ($query) use ($now) {
                        $query->where('appointment_date', $now->toDateString())
                                ->where('appointment_time', '>=', $now->toTimeString());
                    });
            })
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'doctor' => [
                        'prenom' => $appointment->doctor->prenom,
                        'nom' => $appointment->doctor->nom,
                        'speciality' => $appointment->doctor->speciality
                    ],
                    'appointment_date' => $appointment->appointment_date,
                    'appointment_time' => $appointment->appointment_time,
                    'type' => $appointment->type,
                    'reason' => $appointment->reason,
                    'conference_id' => $appointment->conference_id,
                    'call_started' => $appointment->call_started,
                ];
            });

        return response()->json($upcomingAppointments);
    }

    /**
     * Nouvelle méthode : Récupérer les rendez-vous vidéo d'un docteur pour aujourd'hui.
     */
    public function getDoctorVideoAppointmentsToday(Request $request)
    {
        // Vérifier que l'utilisateur est authentifié et est un docteur
        if (!Auth::check() || Auth::user()->role !== 'docteur') {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $doctor = Auth::user();
        $today = Carbon::today(); // Obtient la date d'aujourd'hui sans l'heure

        $appointments = Appointment::with('patient') // Charge les informations du patient lié au rendez-vous
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $today) // Filtre par la date d'aujourd'hui
            ->where('type', 'video') // Filtre pour les rendez-vous de type 'teleconsultation'
            ->whereIn('status', ['en attente', 'confirmé']) // Seulement les rendez-vous en attente ou confirmés
            ->orderBy('appointment_time', 'asc') // Tri par heure
            ->get();

        // Formater la réponse pour inclure les détails nécessaires côté front-end
        $formattedAppointments = $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'patient_name' => $appointment->patient->prenom . ' ' . $appointment->patient->nom,
                'date' => Carbon::parse($appointment->appointment_date)->format('Y-m-d'),
                'time' => Carbon::parse($appointment->appointment_time)->format('H:i'),
                'type' => $appointment->type,
                'reason' => $appointment->reason,
                'status' => $appointment->status,
                'conference_id' => $appointment->conference_id, // Assurez-vous que ce champ existe dans votre modèle Appointment
                'call_started' => $appointment->call_started,   // Assurez-vous que ce champ existe dans votre modèle Appointment
            ];
        });

        return response()->json($formattedAppointments);
    }

    /**
     * Nouvelle méthode : Récupérer les rendez-vous vidéo d'un patient pour aujourd'hui.
     */
    public function getPatientVideoAppointmentsToday(Request $request)
    {
        // Vérifier que l'utilisateur est authentifié et est un patient
        if (!Auth::check() || Auth::user()->role !== 'patient') {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $patient = Auth::user();
        $today = Carbon::today(); // Obtient la date d'aujourd'hui sans l'heure

        $appointments = Appointment::with('doctor') // Charge les informations du docteur lié au rendez-vous
            ->where('patient_id', $patient->id)
            ->whereDate('appointment_date', $today) // Filtre par la date d'aujourd'hui
            ->where('type', 'video') // Filtre pour les rendez-vous de type 'teleconsultation'
            ->whereIn('status', ['en attente', 'confirmé']) // Seulement les rendez-vous en attente ou confirmés
            ->orderBy('appointment_time', 'asc') // Tri par heure
            ->get();

        // Formater la réponse pour inclure les détails nécessaires côté front-end
        $formattedAppointments = $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'doctor_name' => 'Dr. ' . $appointment->doctor->prenom . ' ' . $appointment->doctor->nom,
                'speciality' => $appointment->doctor->speciality ?? 'Spécialité inconnue',
                'date' => Carbon::parse($appointment->appointment_date)->format('Y-m-d'),
                'time' => Carbon::parse($appointment->appointment_time)->format('H:i'),
                'type' => $appointment->type,
                'reason' => $appointment->reason,
                'status' => $appointment->status,
                'conference_id' => $appointment->conference_id, // Assurez-vous que ce champ existe dans votre modèle Appointment
                'call_started' => $appointment->call_started,   // Assurez-vous que ce champ existe dans votre modèle Appointment
            ];
        });

        return response()->json($formattedAppointments);
    }

    /**
     * Nouvelle méthode : Démarrer un appel vidéo (côté docteur).
     */
    public function startVideoCall($id)
    {
        $appointment = Appointment::findOrFail($id);

        // Vérifie que le docteur connecté est bien le docteur de ce rendez-vous
        if (Auth::id() != $appointment->doctor_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Vérifie que le rendez-vous est bien de type 'video' et est confirmé
        if ($appointment->type !== 'video' || $appointment->status !== 'confirmé') {
            return response()->json(['message' => 'Ce rendez-vous ne peut pas être démarré en vidéo ou n\'est pas confirmé.'], 400);
        }

        // Si conference_id n'existe pas, en générer un nouveau 
        if (is_null($appointment->conference_id)) {
            $appointment->conference_id = Str::uuid();
        }

        $appointment->call_started = true;
        $appointment->save();

        // Récupérer les instances complètes du patient et du docteur
        $patient = User::find($appointment->patient_id);
        $docteur = Auth::user(); // Le docteur est l'utilisateur authentifié

        // Envoyer une notification au patient que l'appel a démarré
        if ($patient) {
            $patient->notify(new ConsultationNotification($appointment, 'demarree', $docteur, $patient));
        }

        return response()->json(['message' => 'Appel vidéo démarré', 'appointment' => $appointment]);
    }

    /**
     * Nouvelle méthode : Terminer un appel vidéo (optionnel).
     */
    public function endVideoCall($id,Request $request)
    {
        $appointment = Appointment::where('conference_id',$id)->first();
        $newappointment = Appointment::findOrFail($appointment->id);

        // Vérification de l'autorisation
        if (Auth::id() != $appointment->doctor_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $newappointment->call_started=false;
        $newappointment->status='terminé';
        $newappointment->save();

        return response()->json([
            'message' => 'Consultation terminée',
            'appointment' => $newappointment
        ]);
    }


    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */

     //supprime
    public function destroy($id)
    {
        $appointment = Appointment::findOrFail($id);
        if(Auth::id() != $appointment->patient_id){
            return response()->json(['error' => 'Accès refusé'], 403);
        }
        $appointment->delete();
        return response()->json(['message' => 'Rendez-vous annulé avec succès']);
    }
}
