<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DemandeRenouvellement;

class DemandeRenouvellementController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'prescription_id' => 'required|exists:prescriptions,id',
        ]);

        $user = auth()->user(); // patient connecté

        $existing = \App\Models\DemandeRenouvellement::where('prescription_id', $request->prescription_id)
            ->where('patient_id', $user->id)
            ->where('status', 'en attente')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Une demande est déjà en attente.'], 409);
        }

        $renewal = \App\Models\DemandeRenouvellement::create([
            'prescription_id' => $request->prescription_id,
            'patient_id' => $user->id,
        ]);

        return response()->json(['message' => 'Demande de renouvellement envoyée avec succès.']);
    }
    public function index()
    {
        $renouvellements = \App\Models\DemandeRenouvellement::with([
        'patient', 
        'prescription.medications',
        'prescription.doctor'
    ])->get();

    return response()->json($renouvellements);
}
    public function approve($id)
    {
        try {
            $demande = DemandeRenouvellement::findOrFail($id);
            
            // Récupérer la prescription originale avec ses médicaments
            $originalPrescription = \App\Models\Prescription::with('medications')->findOrFail($demande->prescription_id);
            
            // Vérifier qu'il reste des renouvellements disponibles
            if ($originalPrescription->renewals <= 0) {
                return response()->json([
                    'message' => 'Aucun renouvellement disponible pour cette prescription.'
                ], 400);
            }
            
            // Décrémenter le nombre de renouvellements de la prescription originale
            $originalPrescription->renewals -= 1;
            $originalPrescription->save();
            
            // Créer une nouvelle prescription basée sur l'originale
            $newPrescription = \App\Models\Prescription::create([
                'patient_id' => $originalPrescription->patient_id,
                'doctor_id' => $originalPrescription->doctor_id,
                'notes' => $originalPrescription->notes . ' (Renouvellement)',
                'renewals' => $originalPrescription->renewals, // Même nombre de renouvellements restants
                'status' => 'envoyé' // Statut envoyé car c'est un renouvellement approuvé
            ]);
            
            // Copier tous les médicaments de l'ancienne prescription vers la nouvelle
            foreach ($originalPrescription->medications as $medication) {
                \App\Models\PrescriptionMedication::create([
                    'prescription_id' => $newPrescription->id,
                    'medication_name' => $medication->medication_name,
                    'dosage' => $medication->dosage,
                    'frequency' => $medication->frequency,
                    'duration' => $medication->duration
                ]);
            }
            
            // Marquer la demande comme approuvée
            $demande->status = 'approuvée';
            $demande->save();
            
            return response()->json([
                'message' => 'Demande approuvée avec succès. Nouvelle prescription créée.',
                'new_prescription_id' => $newPrescription->id,
                'remaining_renewals' => $originalPrescription->renewals
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'approbation: ' . $e->getMessage()
            ], 500);
        }
    }
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string'
        ]);
        
        $demande = DemandeRenouvellement::findOrFail($id);
        $demande->status = 'refusée';
        $demande->save();
        
        return response()->json(['message' => 'Demande rejetée avec succès']);
    }

}
