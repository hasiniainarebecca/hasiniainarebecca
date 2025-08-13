<?php

namespace App\Http\Controllers;

use App\Models\ServiceRequest;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Notifications\ServiceNotification; 
use Carbon\Carbon;

class ServiceRequestController extends Controller
{
    /**
     * Infirmier: Récupérer les demandes de service reçues.
     */
    public function nurseRequests(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'infirmier') {
            return response()->json(['message' => 'Non autorisé. Seuls les infirmiers peuvent consulter leurs demandes de service.'], 403);
        }

        $query = ServiceRequest::where('nurse_id', $user->id);

        if ($request->has('status')) {
            $statuses = explode(',', $request->input('status')); // Handle comma-separated statuses
            $validStatuses = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];
            $invalidStatuses = array_diff($statuses, $validStatuses);

            if (!empty($invalidStatuses)) {
                return response()->json(['message' => 'Statut(s) de demande invalide(s).'], 400);
            }
            $query->whereIn('status', $statuses);
        }

        // Eager load service and patient information, including patient email and service type
        $serviceRequests = $query->with(['service:id,title,type_professionnel', 'patient:id,nom,prenom,email'])->get();

        // Transform status to French for the frontend and add robust checks
        $transformedRequests = $serviceRequests->map(function ($request) {
            $request->status_fr = $this->mapStatusToFrench($request->status);

            // Ensure service and patient are not null before accessing properties
            $serviceTitle = $request->service ? $request->service->title : 'Service Inconnu';
            $professionalType = $request->service ? $request->service->type_professionnel : 'Inconnu';
            $patientName = $request->patient ? ($request->patient->nom . ' ' . $request->patient->prenom) : 'Patient Inconnu';
            $patientEmail = $request->patient ? $request->patient->email : null; // Get patient email

            // Safely format date and time, provide fallback if null or invalid
            $requestedDate = $request->requested_date ? $request->requested_date->format('d M Y') : null;
            $requestedTime = $request->requested_time ? $request->requested_time->format('H:i') : null;

            // Safely get avatar initials
            $avatarInitials = '??';
            if ($request->patient) {
                $firstInitial = !empty($request->patient->nom) ? $request->patient->nom[0] : '';
                $secondInitial = !empty($request->patient->prenom) ? $request->patient->prenom[0] : '';
                $avatarInitials = ($firstInitial . $secondInitial) ?: '??';
            }

            return [
                'id' => $request->id,
                'serviceName' => $serviceTitle,
                'professionalType' => $professionalType, // Add professional type
                'patientName' => $patientName,
                'patient_email' => $patientEmail, // Add patient email
                'requestedDate' => $requestedDate,
                'requestedTime' => $requestedTime,
                'reason' => $request->reason,
                'status' => $request->status_fr, // Use French status
                'original_status' => $request->status, // Keep original status for logic
                'avatar' => $avatarInitials
            ];
        });

        return response()->json($transformedRequests);
    }

    /**
     * Patient: Faire une demande de service.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Non autorisé. Seuls les patients peuvent faire des demandes de service.'], 403);
        }

        $validatedData = $request->validate([
            'service_id' => 'required|exists:services,id',
            'requested_date' => 'required|date|after_or_equal:today',
            'requested_time' => 'required|date_format:H:i',
            'reason' => 'nullable|string',
        ]);

        $service = Service::find($validatedData['service_id']);

        // Vérifier si le service existe et obtenir l'ID de l'infirmier
        if (!$service) {
            return response()->json(['message' => 'Service introuvable.'], 404);
        }

        $serviceRequest = ServiceRequest::create([
            'service_id' => $validatedData['service_id'],
            'patient_id' => $user->id,
            'nurse_id' => $service->nurse_id, // L'ID de l'infirmier qui propose ce service
            'requested_date' => $validatedData['requested_date'],
            'requested_time' => $validatedData['requested_time'],
            'status' => 'pending', // Nouvelle demande est toujours en attente
            'reason' => $validatedData['reason'],
        ]);

        // --- NOTIFICATION : Nouvelle demande de service à l'infirmier ---
        $nurse = User::find($service->nurse_id);
        if ($nurse) {
            $nurse->notify(new ServiceNotification('nouvelle_demande_infirmier', $service, $serviceRequest, $user));
        }
        // --- FIN NOTIFICATION ---

        return response()->json(['message' => 'Demande de service envoyée avec succès.', 'data' => $serviceRequest], 201);
    }

    /**
     * Patient: Annuler une demande de service.
     */
    public function cancel(ServiceRequest $serviceRequest)
    {
        $user = Auth::user();

        if ($user->role !== 'patient' || $serviceRequest->patient_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé. Cette demande ne vous appartient pas ou vous n\'êtes pas patient.'], 403);
        }

        // Seules les demandes en attente ou acceptées peuvent être annulées par le patient
        if ($serviceRequest->status === 'pending' || $serviceRequest->status === 'accepted') {
            $serviceRequest->status = 'cancelled';
            $serviceRequest->save();
            return response()->json(['message' => 'Demande de service annulée avec succès.']);
        }

        return response()->json(['message' => 'Impossible d\'annuler cette demande. Son statut est déjà ' . $serviceRequest->status . '.'], 400);
    }

    /**
     * Patient: Récupérer toutes ses demandes de service.
     */
    public function patientRequests(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Non autorisé. Seuls les patients peuvent consulter leurs demandes de service.'], 403);
        }

        $query = ServiceRequest::where('patient_id', $user->id);

        if ($request->has('status')) {
            $statuses = explode(',', $request->input('status')); // Handle comma-separated statuses
            $validStatuses = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];
            $invalidStatuses = array_diff($statuses, $validStatuses);

            if (!empty($invalidStatuses)) {
                return response()->json(['message' => 'Statut(s) de demande invalide(s).'], 400);
            }
            $query->whereIn('status', $statuses);
        }

        // Eager load service and nurse information
        $serviceRequests = $query->with(['service', 'nurse:id,nom,prenom,email'])->get();

        // Transform status to French for the frontend
        $transformedRequests = $serviceRequests->map(function ($request) {
            $request->status_fr = $this->mapStatusToFrench($request->status);
            $serviceTitle = $request->service ? $request->service->title : 'Service Inconnu';
            $nurseName = $request->nurse ? ($request->nurse->nom . ' ' . $request->nurse->prenom) : 'Infirmier(ère) Inconnu(e)';

            // Safely format date and time, provide fallback if null or invalid
            $requestedDate = $request->requested_date ? $request->requested_date->format('d M Y') : null;
            $requestedTime = $request->requested_time ? $request->requested_time->format('H:i') : null;

            return [
                'id' => $request->id,
                'serviceName' => $serviceTitle,
                'professionalType' => $request->service ? $request->service->type_professionnel : 'Inconnu', // Assuming service has this field
                'requestDate' => $requestedDate,
                'scheduledDate' => $requestedDate . ($requestedTime ? ', ' . $requestedTime : ''), // Combine date and time
                'status' => $request->status_fr,
                'notes' => $request->reason,
                'provider' => $nurseName,
                'original_status' => $request->status,
            ];
        });

        return response()->json($transformedRequests);
    }


    /**
     * Infirmier: Accepter une demande de service.
     */
    public function accept(ServiceRequest $serviceRequest)
    {
        $user = Auth::user();

        if ($user->role !== 'infirmier' || $serviceRequest->nurse_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé. Cette demande ne vous est pas destinée ou vous n\'êtes pas infirmier.'], 403);
        }

        if ($serviceRequest->status === 'pending') {
            $serviceRequest->status = 'accepted';
            $serviceRequest->save();

            // --- NOTIFICATION : Demande de service acceptée au patient ---
            $patient = User::find($serviceRequest->patient_id);
            if ($patient) {
                $patient->notify(new ServiceNotification('demande_acceptee', null, $serviceRequest, $user));
            }
            // --- FIN NOTIFICATION ---

            return response()->json(['message' => 'Demande de service acceptée avec succès.']);
        }

        return response()->json(['message' => 'Impossible d\'accepter cette demande. Son statut est déjà ' . $serviceRequest->status . '.'], 400);
    }

    /**
     * Infirmier: Rejeter une demande de service.
     */
    public function reject(ServiceRequest $serviceRequest)
    {
        $user = Auth::user();

        if ($user->role !== 'infirmier' || $serviceRequest->nurse_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé. Cette demande ne vous est pas destinée ou vous n\'êtes pas infirmier.'], 403);
        }

        if ($serviceRequest->status === 'pending') {
            $serviceRequest->status = 'rejected';
            $serviceRequest->save();

        // --- NOTIFICATION : Demande de service refusée au patient ---
            $patient = User::find($serviceRequest->patient_id);
            if ($patient) {
                $patient->notify(new ServiceNotification('demande_refusee', null, $serviceRequest, $user));
            }
        // --- FIN NOTIFICATION ---

            return response()->json(['message' => 'Demande de service rejetée.']);
        }

        return response()->json(['message' => 'Impossible de rejeter cette demande. Son statut est déjà ' . $serviceRequest->status . '.'], 400);
    }

    /**
     * Infirmier: Marquer une demande comme terminée.
     */
    public function complete(ServiceRequest $serviceRequest)
    {
        $user = Auth::user();

        if ($user->role !== 'infirmier' || $serviceRequest->nurse_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé. Cette demande ne vous est pas destinée ou vous n\'êtes pas infirmier.'], 403);
        }

        if ($serviceRequest->status === 'accepted' || $serviceRequest->status === 'pending') { // Can only complete if accepted or still pending
            $serviceRequest->status = 'completed';
            $serviceRequest->save();
            return response()->json(['message' => 'Demande de service marquée comme terminée.']);
        }

        return response()->json(['message' => 'Impossible de marquer cette demande comme terminée. Son statut est ' . $serviceRequest->status . '.'], 400);
    }

    /**
     * Helper function to map status to French.
     */
    private function mapStatusToFrench($status)
    {
        switch ($status) {
            case 'pending':
                return 'En Attente';
            case 'accepted':
                return 'Confirmé';
            case 'rejected':
                return 'Rejetée'; // Changed from 'Annulé' to 'Rejetée' for clarity
            case 'cancelled':
                return 'Annulé';
            case 'completed':
                return 'Terminé';
            default:
                return ucfirst($status);
        }
    }
}