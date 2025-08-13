<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Materiel;
use App\Models\MaterielLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User; // Importez le modèle User
use App\Notifications\MaterielNotification;

class MaterielController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $materiels = Materiel::where('etablissement_id', $user->etablissement_id)->get();
        return response()->json($materiels);
    }

    public function store(Request $request)
    {
        $user = auth()->user(); // ou Auth::user()

        if (!$user || !$user->etablissement_id) {
            return response()->json(['error' => 'Utilisateur non connecté ou établissement introuvable'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'current_stock' => 'required|integer',
            'min_stock' => 'required|integer',
            'unit' => 'required|string',
            'location' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'supplier' => 'nullable|string',
        ]);

        $validated['etablissement_id'] = $user->etablissement_id;

        $materiel = Materiel::create($validated);

        // Log facultatif
        MaterielLog::create([
            'user_id' => $user->id,
            'materiel_id' => $materiel->id,
            'quantity_added' => $validated['current_stock'],
            'quantity_removed' => 0,
            'operation_type' => 'ajout_initial',
            'notes' => "Ajout initial",
            'destination' => null
        ]);


        // --- NOTIFICATION : Matériel ajouté ---
        $usersToNotify = User::where('etablissement_id', $user->etablissement_id)
                             ->whereIn('role', ['infirmier', 'anesthésiste']) // <-- CORRECTION ICI
                             ->where('id', '!=', $user->id) // N'envoie pas à l'expéditeur
                             ->get();
        foreach ($usersToNotify as $recipient) {
            $recipient->notify(new MaterielNotification('materiel_ajoute', $materiel, $user, $materiel->current_stock));
        }
        // --- FIN NOTIFICATION ---

        return response()->json([
            'message' => "{$user->nom} a ajouté {$validated['current_stock']} {$validated['unit']} de {$validated['name']}",
            'materiel' => $materiel
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();

        // Trouver le matériel à mettre à jour
        $materiel = Materiel::where('id', $id)
                    ->where('etablissement_id', $user->etablissement_id)
                    ->firstOrFail();

        // Valider les données entrantes
        $validated = $request->validate([
            'current_stock' => 'required|integer|min:0',
            // Vous pouvez ajouter d'autres champs modifiables si nécessaire
        ]);

        // Calculer la quantité ajoutée (pour le log)
        $quantityAdded = $validated['current_stock'] - $materiel->current_stock;

        // Mettre à jour le matériel
        $materiel->update($validated);

        // Log de l'opération
        MaterielLog::create([
            'user_id' => $user->id,
            'materiel_id' => $materiel->id,
            'quantity_added' => $quantityAdded,
            'quantity_removed' => 0,
            'operation_type' => 'reapprovisionnement',
            'notes' => "Réapprovisionnement effectué",
            'destination' => null
        ]);

        // --- NOTIFICATION : Matériel modifié ---
            $usersToNotify = User::where('etablissement_id', $user->etablissement_id)
                                 ->whereIn('role', ['infirmier', 'anesthésiste'])
                                 ->where('id', '!=', $user->id)
                                 ->get();
            foreach ($usersToNotify as $recipient) {
                $recipient->notify(new MaterielNotification('materiel_modifie', $materiel, $user));
            }
            // --- FIN NOTIFICATION ---

        return response()->json([
            'message' => "Stock mis à jour avec succès",
            'materiel' => $materiel
        ]);
    }

    // Dans MaterielController.php
    public function decrementStock(Request $request, $id)
    {
        $user = auth()->user();
        $materiel = Materiel::where('id', $id)
                    ->where('etablissement_id', $user->etablissement_id)
                    ->firstOrFail();

        $validated = $request->validate([
            'quantity_used' => 'required|integer|min:1|max:'.$materiel->current_stock,
            'reason' => 'required|string|max:255',
            'user_id' => 'nullable|exists:users,id'
        ]);

        if ($materiel->current_stock < $validated['quantity_used']) {
                return response()->json(['message' => 'Quantité insuffisante en stock.'], 400);
        }

        $materiel->decrement('current_stock', $validated['quantity_used']);

        MaterielLog::create([
            'user_id' => $validated['user_id'] ?? $user->id,
            'materiel_id' => $materiel->id,
            'quantity_removed' => $validated['quantity_used'],
            'operation_type' => 'utilisation', // <-- Ajout explicite
            'notes' => $validated['reason'],
            'quantity_added' => 0,
            'destination' => null
        ]);

        // --- NOTIFICATION : Matériel utilisé ---
        $usersToNotify = User::where('etablissement_id', $user->etablissement_id)
                             ->whereIn('role', ['infirmier', 'anesthésiste']) // <-- CORRECTION ICI
                             ->where('id', '!=', $user->id)
                             ->get();
        foreach ($usersToNotify as $recipient) {
            $recipient->notify(new MaterielNotification('materiel_utilise', $materiel, $user, $validated['quantity_used']));
        }
        // --- FIN NOTIFICATION ---

        // Vérifier le stock faible après utilisation
            if ($materiel->current_stock <= $materiel->min_stock) {
                $this->notifyLowStock($materiel, $user);
            }


        return response()->json([
            'message' => 'Stock diminué avec succès',
            'remaining_stock' => $materiel->fresh()->current_stock // Utilisez fresh() pour obtenir la valeur actualisée
        ]);
    }

    public function checkLowStock()
    {
        $etablissementId = auth()->user()->etablissement_id;

        $lowStockItems = Materiel::where('etablissement_id', $etablissementId)
                                    ->whereColumn('current_stock', '<=', 'min_stock')
                                    ->get();

        // --- NOTIFICATION : Stock faible (pour chaque article faible) ---
        foreach ($lowStockItems as $materiel) {
            // Pour éviter de spammer, on pourrait ajouter une logique ici
            // pour vérifier si une notification a déjà été envoyée récemment pour cet article.
            // Pour l'instant, on envoie à chaque fois que la fonction est appelée et que le stock est faible.
            $usersToNotify = User::where('etablissement_id', $etablissementId)
                                 ->whereIn('role', ['infirmier', 'anesthésiste']) // <-- CORRECTION ICI
                                 ->get(); // Envoyer à tous les infirmiers/anesthésistes de l'établissement
            foreach ($usersToNotify as $recipient) {
                $recipient->notify(new MaterielNotification('stock_faible', $materiel));
            }
        }
        // --- FIN NOTIFICATION ---

        return response()->json([
            'critical' => Materiel::where('etablissement_id', $etablissementId)
                        ->whereColumn('current_stock', '<=', 'min_stock')
                        ->count(),
            
            'warning' => Materiel::where('etablissement_id', $etablissementId)
                        ->whereColumn('current_stock', '<=', DB::raw('min_stock * 1.5'))
                        ->whereColumn('current_stock', '>', 'min_stock') // Évite le double-compte
                        ->count(),
            
            'items' => Materiel::where('etablissement_id', $etablissementId)
                        ->whereColumn('current_stock', '<=', 'min_stock')
                        ->select(['id', 'name', 'current_stock', 'min_stock', 'supplier', 'unit']) // Inclure les champs nécessaires
                        ->get()
        ]);
    }
}