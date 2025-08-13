<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PrescriptionMedication;
use Illuminate\Http\Request;
use App\Models\User; // Assurez-vous que cette ligne est présente
use Illuminate\Support\Facades\Auth; // Assurez-vous que cette ligne est présente
use Carbon\Carbon;
use App\Notifications\PrescriptionNotification;

class PrescriptionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id', // ou doctors
            'notes' => 'nullable|string',
            'renewals' => 'nullable|integer|min:0',
            'status' => 'required|in:brouillon,envoyé',
            'medications' => 'required|array',
            'medications.*.medication_name' => 'required|string',
            'medications.*.dosage' => 'required|string',
            'medications.*.frequency' => 'nullable|string',
            'medications.*.duration' => 'nullable|string',
        ]);

        $prescription = Prescription::create([
            'patient_id' => $validated['patient_id'],
            'doctor_id' => $validated['doctor_id'],
            'notes' => $validated['notes'] ?? null,
            'renewals' => $validated['renewals'] ?? 0,
            'status' => $validated['status'],
        ]);

        foreach ($validated['medications'] as $medication) {
            $prescription->medications()->create($medication);
        }

        // Récupérer les objets User pour le docteur et le patient pour la notification
        $patient = User::find($validated['patient_id']);
        $doctor = User::find($validated['doctor_id']);

        // Si l'ordonnance est créée et directement "envoyée"
        if ($prescription->status === 'envoyé') {
            if ($patient) {
                $patient->notify(new PrescriptionNotification($prescription, 'created', $doctor, $patient));
            }
        }

        return response()->json(['message' => 'Ordonnance créée avec succès !']);
    }

    public function getByPatient($patient_id)
    {
        $prescriptions = Prescription::with(['medications', 'doctor'])
            ->where('patient_id', $patient_id)
            ->get();

        return response()->json($prescriptions);
    }

     public function getByPatientDash($patientId)
    {
        // Vérifie que l'utilisateur connecté est bien le patient ou un docteur/admin
        // capable de voir les prescriptions de ce patient.
        // Pour un tableau de bord patient, seul le patient lui-même doit y avoir accès.
        if (Auth::user()->role !== 'patient' || Auth::id() != $patientId) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Get the start and end of the current month
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $prescriptions = Prescription::with('doctor:id,nom,prenom') // Charge le docteur et sélectionne les champs nom et prenom
                                     ->where('patient_id', $patientId)
                                     ->where('status', 'envoyé') // Filter by 'envoyé' status
                                     ->whereBetween('created_at', [$startOfMonth, $endOfMonth]) // Filter for current month
                                     ->orderBy('created_at', 'desc') // Les plus récentes en premier
                                     ->limit(5) // Limiter aux 5 dernières, ou selon votre besoin
                                     ->get()
                                     ->map(function ($prescription) {
                                        $doctorName = null;
                                        if ($prescription->doctor) {
                                            $doctorName = 'Dr. ' . $prescription->doctor->prenom . ' ' . $prescription->doctor->nom;
                                        } else {
                                            $doctorName = 'N/A';
                                        }

                                        return [
                                            'id' => $prescription->id,
                                            'doctor_name' => $doctorName, // C'est le champ que vous envoyez
                                            'date' => $prescription->created_at->toIso8601String(),
                                            'status' => $prescription->status,
                                            'notes' => $prescription->notes,
                                        ];
                                     });

        return response()->json($prescriptions);
    }

    public function getDraftPrescriptions(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'docteur') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $prescriptions = Prescription::with(['medications', 'patient'])
            ->where('doctor_id', $user->id)
            ->where('status', 'brouillon')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($prescriptions);
    }

    public function destroy($id)
    {
        $prescription = Prescription::find($id);
        if (!$prescription) {
            return response()->json(['message' => 'Ordonnance non trouvée'], 404);
        }

        $prescription->delete();
        return response()->json(['message' => 'Ordonnance supprimée avec succès']);
    }


    public function show($id)
    {
        $draft = Prescription::with(['patient', 'medications'])->findOrFail($id);
        return response()->json($draft);
    }

    public function update(Request $request, $id)
    {
        $draft = Prescription::findOrFail($id);

        $draft->notes = $request->input('notes');
        $draft->renewals = $request->input('renewals'); // <-- ajoute cette ligne

        $draft->save(); // <-- assure-toi aussi de sauvegarder !

        // Supprimer les anciens médicaments
        $draft->medications()->delete();
        foreach ($request->medications as $med) {
            $draft->medications()->create($med);
        }

        return response()->json(['message' => 'Brouillon mis à jour']);
    }

    public function destroyMedication($prescriptionId, $medicationId)
    {
        $prescription = Prescription::find($prescriptionId);

        if (!$prescription) {
            return response()->json(['message' => 'Ordonnance non trouvée'], 404);
        }

        $medication = $prescription->medications()->find($medicationId);

        if (!$medication) {
            return response()->json(['message' => 'Médicament non trouvé dans cette ordonnance'], 404);
        }

        $medication->delete();

        return response()->json(['message' => 'Médicament supprimé avec succès']);
    }

    public function envoyer($id)
    {
        $prescription = Prescription::findOrFail($id);

        if ($prescription->status !== 'brouillon') {
            return response()->json(['message' => 'Ordonnance déjà envoyée.'], 400);
        }

        $prescription->status = 'envoyé';
        $prescription->save();

        // Récupérer les objets User pour le docteur et le patient
        $patient = $prescription->patient; // Assurez-vous que la relation patient est bien définie dans votre modèle Prescription
        $doctor = $prescription->doctor;   // Assurez-vous que la relation doctor est bien définie dans votre modèle Prescription

        // --- ENVOI DE LA NOTIFICATION LORS DE L'ENVOI D'UNE ORDONNANCE ---
        if ($patient) {
            $patient->notify(new PrescriptionNotification($prescription, 'sent', $doctor, $patient));
        }

        return response()->json(['message' => 'Ordonnance envoyée avec succès.']);
    }

// Dans PrescriptionController.php
public function verifyPrescription($id)
{
    $prescription = Prescription::with(['doctor', 'patient'])->find($id);

    if (!$prescription) {
        return view('prescriptions.verification', [
            'status' => 'invalid',
            'message' => 'Cette ordonnance n\'existe pas dans notre système.'
        ]);
    }

    $expiryDate = $prescription->expiry_date ?? $prescription->created_at->addMonths(3);
    $isExpired = now()->gt($expiryDate);

    return view('prescriptions.verification', [
        'status' => $isExpired ? 'expired' : 'valid',
        'message' => $isExpired 
            ? 'Ordonnance expirée le ' . $expiryDate->format('d/m/Y')
            : 'Ordonnance valide jusqu\'au ' . $expiryDate->format('d/m/Y'),
        'prescription' => $prescription
    ]);
}

}
