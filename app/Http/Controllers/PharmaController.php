<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Pharmacie;
use Illuminate\Http\Request;

class PharmaController extends Controller
{
    public function listePharmacie()
    {
        $pharmacies = Pharmacie::all(['id', 'nom']);
        return response()->json($pharmacies);
    }
    public function pharmacieMed()
    {
        // On récupère toutes les pharmacies validées, avec leur stock de médicaments
        $pharmacies = Pharmacie::with('medications')->get();

        return response()->json($pharmacies);
    }
    public function toggleLivraison($id)
    {
        $pharmacie = Pharmacie::findOrFail($id);
        $pharmacie->has_delivery = !$pharmacie->has_delivery;
        $pharmacie->save();

        return response()->json(['success' => true, 'has_delivery' => $pharmacie->has_delivery]);
    }

    public function getMyPharmacy(Request $request)
    {
        $user = $request->user();

        // Vérifie que l'utilisateur est bien un pharmacien
        if ($user->role !== 'pharmacien') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Vérifie qu'il a bien une pharmacie assignée
        if (!$user->pharmacie_id) {
            return response()->json(['message' => 'Aucune pharmacie assignée'], 404);
        }

        $pharmacy = Pharmacie::find($user->pharmacie_id);

        if (!$pharmacy) {
            return response()->json(['message' => 'Pharmacie introuvable'], 404);
        }

        return response()->json($pharmacy);
    }
}
