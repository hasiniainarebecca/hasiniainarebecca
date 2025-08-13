<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Notifications\ServiceNotification; // <-- AJOUTEZ CETTE LIGNE
use App\Models\User;

class ServiceController extends Controller
{
    /**
     * Afficher tous les services de l'infirmier connecté.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->role !== 'infirmier') {
            return response()->json(['message' => 'Non autorisé. Seuls les infirmiers peuvent gérer leurs services.'], 403);
        }

        $services = $user->offeredServices; // Utilise la relation définie dans le modèle User
        return response()->json($services);
    }

    /**
     * Créer un nouveau service.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'infirmier') {
            return response()->json(['message' => 'Non autorisé. Seuls les infirmiers peuvent créer des services.'], 403);
        }

        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'availability' => 'nullable|string|max:255',
            'price' => 'nullable|string|max:255',
        ]);

        $service = $user->offeredServices()->create($validatedData); // Associe le service à l'infirmier connecté

        // --- NOTIFICATION : Nouveau service publié ---
        // Notifier tous les patients qu'un nouveau service a été publié
        $patients = User::where('role', 'patient')->get();
        foreach ($patients as $patient) {
            $patient->notify(new ServiceNotification('nouveau_service', $service, null, $user));
        }
        // --- FIN NOTIFICATION ---

        return response()->json($service, 201);
    }

    /**
     * Mettre à jour un service existant.
     */
    public function update(Request $request, Service $service)
    {
        $user = Auth::user();

        if ($user->role !== 'infirmier' || $service->nurse_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé. Ce service ne vous appartient pas ou vous n\'êtes pas infirmier.'], 403);
        }

        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'availability' => 'nullable|string|max:255',
            'price' => 'nullable|string|max:255',
        ]);

        $service->update($validatedData);

        return response()->json($service);
    }

    /**
     * Supprimer un service.
     */
    public function destroy(Service $service)
    {
        $user = Auth::user();

        if ($user->role !== 'infirmier' || $service->nurse_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé. Ce service ne vous appartient pas ou vous n\'êtes pas infirmier.'], 403);
        }

        // Vérifier s'il y a des demandes "pending" ou "accepted" pour ce service
        if ($service->serviceRequests()->whereIn('status', ['pending', 'accepted'])->exists()) {
            return response()->json(['message' => 'Impossible de supprimer ce service car il a des demandes en cours ou acceptées.'], 409); // Conflict
        }

        $service->delete();

        return response()->json(['message' => 'Service supprimé avec succès.']);
    }

    /**
     * Afficher tous les services disponibles pour les patients (de tous les infirmiers).
     */
    public function allServices()
    {
        // Seuls les patients peuvent voir tous les services (ou tout utilisateur authentifié pour le moment)
        // Vous pouvez ajouter une vérification de rôle si nécessaire, par exemple :
        // if (Auth::user()->role !== 'patient') {
        //     return response()->json(['message' => 'Non autorisé.'], 403);
        // }
        $services = Service::with('nurse:id,nom,prenom,email')->get(); // Inclure des infos sur l'infirmier
        return response()->json($services);
    }
}
