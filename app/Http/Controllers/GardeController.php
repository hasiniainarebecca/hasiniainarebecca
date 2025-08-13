<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Garde;
use App\Models\User; 
use App\Notifications\ScheduleNotification; 

class GardeController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        $query = Garde::with(['infirmier', 'etablissement']);

        if ($user->etablissement_id) {
            $query->where('etablissement_id', $user->etablissement_id);
        }

        return response()->json($query->get());
    }


    public function store(Request $request)
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'infirmier_id' => 'required|exists:users,id',
            'service' => 'required|string',
            'date' => 'required|date',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
        ]);

        // Utilisez directement l'ID de l'établissement
        $validated['etablissement_id'] = $user->etablissement_id;
        $validated['statut'] = 'en attente';

        $garde = Garde::create($validated);

        // --- NOTIFICATION : Nouvelle garde envoyée à l'infirmier ---
        $infirmierDestinataire = User::find($garde->infirmier_id);
        if ($infirmierDestinataire) {
            $infirmierDestinataire->notify(new ScheduleNotification('nouvelle_garde', $garde, $user));
        }
        // --- FIN NOTIFICATION ---

        return response()->json($garde, 201);
    }
    /**
     * Accepter une garde assignée
     */
    public function accepter($id)
    {
        $garde = Garde::findOrFail($id);

        // Vérifier que l'utilisateur connecté est bien l'infirmier assigné à cette garde
        if ($garde->infirmier_id !== auth()->id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $garde->update(['statut' => 'confirmée']);
        // --- NOTIFICATION : Garde confirmée au docteur ---
        $docteur = User::where('role', 'docteur')
                        ->where('etablissement_id', $garde->etablissement_id)
                        ->first(); // Ou trouver le docteur qui a créé la garde si c'est tracé
        if ($docteur) {
            $docteur->notify(new ScheduleNotification('garde_confirmee', $garde, auth()->user())); // L'infirmier est le sender
        }
        // --- FIN NOTIFICATION ---

        return response()->json([
            'message' => 'Garde acceptée avec succès',
            'garde' => $garde->load('infirmier')
        ]);
    }

    /**
     * Refuser une garde assignée
     */
    public function refuser(Request $request, $id)
    {
        try {
            $garde = Garde::findOrFail($id);

            if ($garde->infirmier_id !== auth()->id()) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }

            $validated = $request->validate([
                'motif_refus' => 'nullable|string|max:500'
            ]);

            $garde->update([
                'statut' => 'refusée',
                'motif_refus' => $validated['motif_refus'] ?? null
            ]);

            // --- NOTIFICATION : Garde refusée au docteur ---
            $docteur = User::where('role', 'docteur')
                            ->where('etablissement_id', $garde->etablissement_id)
                            ->first(); // Ou trouver le docteur qui a créé la garde
            if ($docteur) {
                $docteur->notify(new ScheduleNotification('garde_refusee', $garde, auth()->user())); // L'infirmier est le sender
            }
            // --- FIN NOTIFICATION ---

            return response()->json([
                'message' => 'Garde refusée',
                'garde' => $garde->load('infirmier')
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur interne',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

}
