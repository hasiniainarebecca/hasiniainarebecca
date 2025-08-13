<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\PharmaController;
use App\Http\Controllers\MedicationController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\PrescriptionOrderController;
use App\Http\Controllers\DemandeRenouvellementController;
use App\Http\Controllers\GardeController;
use App\Http\Controllers\EchangeController;
use App\Http\Controllers\MaterielController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceRequestController;
use App\Models\Etablissement;
use App\Http\Controllers\PatientProfileController; 
use App\Http\Controllers\DoctorPatientController; 
use App\Http\Controllers\NursePatientController;  
use App\Http\Controllers\FileDownloadController;
use App\Http\Controllers\NotificationController;   


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/doctors/{id}/toggle-availability', [UserController::class, 'toggleAvailability']);
    Route::get('/doctors/available', [UserController::class, 'availableDoctors']);
    Route::get('/doctor-id', [UserController::class, 'getConnectedDoctorId']);
    Route::get('/doctor/{doctorId}', [UserController::class, 'getDoctorInfo']);
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/infirmiers', [UserController::class, 'getInfirmiers']);
    
    Route::get('/doctors', [AppointmentController::class, 'getDoctors']);
    Route::post('/appointments',[AppointmentController::class, 'store']);
    Route::get('/appointments/liste', [AppointmentController::class, 'index']);
    Route::get('/appointments/patient',[AppointmentController::class,'getPatientAppointments']);
    Route::get('/appointments/doctor', [AppointmentController::class, 'getDoctorAppointments']);
    Route::put('/appointments/{id}/accept', [AppointmentController::class, 'accept']);
    Route::put('/appointments/{id}/decline', [AppointmentController::class, 'decline']);
    Route::put('/appointments/{id}/complete', [AppointmentController::class, 'complete']);
    Route::put('/appointments/{id}/status',[AppointmentController::class,'updateStatus']);
    Route::put('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule']);
    Route::delete('/appointments/{id}',[AppointmentController::class,'destroy']);
    Route::get('/doctor/{doctorId}/patients', [AppointmentController::class, 'getDoctorPatients']);
    // Routes pour le docteur dashboard (AJOUTEZ CES LIGNES)
    Route::get('/doctor/{id}/stats', [AppointmentController::class, 'getDoctorStats']);
    Route::get('/doctor/{id}/appointments', [AppointmentController::class, 'getDoctorUpcomingAppointments']);

    // Routes pour les consultations vidéo (AJOUTEZ CES LIGNES)
    Route::get('/doctor/appointments/video/today', [App\Http\Controllers\AppointmentController::class, 'getDoctorVideoAppointmentsToday']);
    Route::get('/patient/appointments/video/today', [App\Http\Controllers\AppointmentController::class, 'getPatientVideoAppointmentsToday']);
    Route::post('/appointments/{id}/start-call', [AppointmentController::class, 'startVideoCall']);
    Route::post('/appointments/{id}/end-call', [AppointmentController::class, 'endVideoCall']); // Optionnel


    // Nouvelles routes pour le tableau de bord patient (AJOUTEZ CES LIGNES)
    Route::get('/patient/{id}/upcoming-appointments', [AppointmentController::class, 'getPatientUpcomingAppointments']);
    Route::get('/patient/{id}/recent-prescriptions', [PrescriptionController::class, 'getByPatientDash']);


    Route::get('/prescription-orders-list', [PrescriptionOrderController::class, 'index']);

    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::get('/prescriptions/patient/{patient_id}', [PrescriptionController::class, 'getByPatient']);
    Route::get('/prescriptions/brouillons', [PrescriptionController::class, 'getDraftPrescriptions']);
    Route::delete('/prescriptions/{id}', [PrescriptionController::class, 'destroy']);
    Route::get('/drafts/{id}', [PrescriptionController::class, 'show']);
    Route::put('/drafts/{id}', [PrescriptionController::class, 'update']);
    Route::delete('/prescriptions/{prescriptionId}/medications/{medicationId}', [PrescriptionController::class, 'destroyMedication']);
    Route::put('/prescriptions/{id}/envoyer', [PrescriptionController::class, 'envoyer']);
    Route::get('/verify-prescription/{id}', [PrescriptionController::class, 'verifyPrescription']);
    
    Route::get('/prescriptions/{id}/get-pdf', [PdfController::class, 'download']);
    
    Route::get('/pharmacy/{pharmacy}/medications/liste', [MedicationController::class, 'index']);
    Route::post('/pharmacy/{pharmacy}/medications/store', [MedicationController::class, 'store']);
    Route::put('/medications/{id}/modifier', [MedicationController::class, 'update']);
    Route::delete('/medications/{id}/supprimer', [MedicationController::class, 'destroy']);
    Route::get('/medications/available', [MedicationController::class, 'getAvailableMedications']);

    Route::get('/pharmacies/medicament', [PharmaController::class, 'pharmacieMed']);
    Route::put('/pharmacies/{id}/toggle-delivery', [PharmaController::class, 'toggleLivraison']);
    Route::get('/pharmacies/utilisateur', [PharmaController::class, 'getMyPharmacy']);

    Route::post('/commandes', [CommandeController::class, 'store']);
    Route::get('/pharmacies/commandes', [CommandeController::class, 'index']);
    Route::put('/commandes/{commande}/status', [CommandeController::class, 'updateStatus']);

    Route::post('/prescription-orders', [PrescriptionOrderController::class, 'store']);
    Route::get('/prescription-orders-list', [PrescriptionOrderController::class, 'index']);
    Route::put('/prescription-orders/{id}/status', [PrescriptionOrderController::class, 'updateStatus']);

    // Route::get('/sales/daily', [SalesController::class, 'getDailySales']);
    // Route::get('/sales/weekly', [SalesController::class, 'getWeeklySales']);
    // Routes pour les pharmaciens
    Route::get('/pharmacist/medicaments/low-stock', [PrescriptionOrderController::class, 'getLowStockItems']);
    Route::get('/pharmacist/medicaments/total', [PrescriptionOrderController::class, 'getTotalMedicines']);
    Route::get('/pharmacist/sales-data', [CommandeController::class, 'getSalesData']); // **AJOUTEZ CETTE LIGNE**
    Route::get('/pharmacist/sales-data/suivis', [CommandeController::class, 'getSalesDataSuivis']); // **AJOUTEZ CETTE LIGNE**


    Route::post('/demande-renouvellement', [DemandeRenouvellementController::class, 'store']);
    Route::post('/liste-renouvellement', [DemandeRenouvellementController::class, 'index']);
    Route::put('/demande-renouvellement/{id}/approve', [DemandeRenouvellementController::class, 'approve']);
    Route::put('/demande-renouvellement/{id}/reject', [DemandeRenouvellementController::class, 'reject']);

    Route::get('/gardes', [GardeController::class, 'index']);
    Route::post('/gardes', [GardeController::class, 'store']);
    Route::put('/gardes/{id}/accepter', [GardeController::class, 'accepter']);
    Route::put('/gardes/{id}/refuser', [GardeController::class, 'refuser']);

    Route::get('/echanges', [EchangeController::class, 'index']);
    Route::post('/echanges', [EchangeController::class, 'store']);
    Route::put('/echanges/{id}/valider', [EchangeController::class, 'valider']);
    Route::put('/echanges/{id}/refuser', [EchangeController::class, 'refuser']);

    Route::get('/materiels', [MaterielController::class, 'index']);
    Route::post('/materiels', [MaterielController::class, 'store']);
    Route::put('/materiels/{id}', [MaterielController::class, 'update']);
    Route::post('/materiels/{id}/use', [MaterielController::class, 'decrementStock']);
    Route::post('/materiels/{id}/report-loss', [MaterielController::class, 'reportLoss']);
    Route::post('/materiels/{id}/transfer', [MaterielController::class, 'transferStock']);
    Route::get('/materiels/low-stock', [MaterielController::class, 'checkLowStock']);

    Route::get('/nurse/services', [ServiceController::class, 'index']); // Afficher les services de l'infirmier connecté
    Route::post('/nurse/services', [ServiceController::class, 'store']); // Créer un service
    Route::put('/nurse/services/{service}', [ServiceController::class, 'update']); // Modifier un service
    Route::delete('/nurse/services/{service}', [ServiceController::class, 'destroy']); // Supprimer un service

    // Routes pour les demandes de services reçues par l'infirmier
    Route::get('/nurse/service-requests', [ServiceRequestController::class, 'nurseRequests']); // Afficher les demandes reçues
    Route::post('/nurse/service-requests/{serviceRequest}/accept', [ServiceRequestController::class, 'accept']); // Accepter une demande
    Route::post('/nurse/service-requests/{serviceRequest}/reject', [ServiceRequestController::class, 'reject']); // Refuser une demande
    Route::post('/nurse/service-requests/{serviceRequest}/complete', [ServiceRequestController::class, 'complete']); // Marquer comme terminé

    // Routes pour la gestion des demandes de services par les patients
    Route::post('/patient/service-requests', [ServiceRequestController::class, 'store']); // Faire une demande de service
    Route::get('/patient/service-requests', [ServiceRequestController::class, 'patientRequests']); // Afficher ses propres demandes
    Route::post('/patient/service-requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel']); // Annuler une demande

    // Route pour afficher tous les services disponibles (pour les patients)
    Route::get('/services/catalog', [ServiceController::class, 'allServices']);

    // Patient Profile Routes
    Route::get('/patient/profile', [PatientProfileController::class, 'show']);
    Route::put('/patient/profile', [PatientProfileController::class, 'update']);

    // Doctor Patient Management Routes
    Route::get('/doctors/patients', [DoctorPatientController::class, 'index']);
    Route::get('/doctor/patients/{patientId}', [DoctorPatientController::class, 'show']);
    Route::get('/download/exam-file/{fileName}', [FileDownloadController::class, 'downloadExamFile'])
         ->name('download.exam.file');

    // Nurse Patient Management Routes
    Route::get('/nurse/patients', [NursePatientController::class, 'index']);
    Route::get('/nurse/patients/{patient}', [NursePatientController::class, 'show']);


    // Routes pour les notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/unread/count', [NotificationController::class, 'getUnreadCount']);


    // Routes pour la messagerie
    Route::prefix('messages')->group(function () {
        Route::get('/conversations', [MessageController::class, 'getConversations']);
        Route::get('/conversation/{conversationUuid}', [MessageController::class, 'getMessages']);
        Route::post('/conversation/{conversationUuid}/send', [MessageController::class, 'sendMessage']);
        Route::post('/start-conversation', [MessageController::class, 'startConversation']);
        Route::get('/available-chat-users', [MessageController::class, 'getAvailableChatUsers']);
    });

    Route::post('/logout', function (Request $request) {
        try {
            \Log::info('Tentative de déconnexion', [
                'user' => $request->user() ? $request->user()->id : null,
                'tokens' => $request->user() ? $request->user()->tokens : null
            ]);
            
            if (!$request->user()) {
                return response()->json(['error' => 'Non authentifié'], 401);
            }
            
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Déconnecté avec succès']);
        } catch (\Exception $e) {
            \Log::error('Erreur déconnexion', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    })->middleware('auth:sanctum');
});

Route::get('/pharmacies', function () {
        return \App\Models\Pharmacie::all();
    });
Route::get('/establishments', function () {
    try {
        return response()->json(Etablissement::all());
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Erreur lors de la récupération des établissements',
            'details' => $e->getMessage()
        ], 500);
    }
});
Route::get('/pharmacies', [PharmaController::class, 'listePharmacie']);
Route::post('/connexion', [UserController::class, 'login']);
Route::post('/inscription', [UserController::class, 'store']);