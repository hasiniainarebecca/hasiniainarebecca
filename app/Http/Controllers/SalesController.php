<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Commande;
use App\Models\PrescriptionOrder;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class SalesController extends Controller
{
    /**
     * Calcule le total des ventes pour aujourd'hui pour la pharmacie de l'utilisateur connecté.
     * Les ventes sont les commandes et les ordonnances acceptées.
     */
    public function getDailySales(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->pharmacie_id) {
            return response()->json(['message' => 'Utilisateur non authentifié ou sans pharmacie associée.'], 403);
        }

        $pharmacyId = $user->pharmacie_id;
        $today = Carbon::today();

        // Total des ventes des commandes sans ordonnance acceptées aujourd'hui
        $totalCommandesSales = Commande::where('pharmacy_id', $pharmacyId)
                                     ->where('status', 'acceptée')
                                     ->whereDate('updated_at', $today) // Utiliser updated_at car c'est quand le statut change
                                     ->sum('prix_total');
    return response()->json(['dailySales' => $totalCommandesSales]);
    }
    
    /**
     * Calcule le total des ventes hebdomadaires pour la pharmacie de l'utilisateur connecté.
     * Les ventes sont les commandes et les ordonnances acceptées.
     */
    public function getWeeklySales(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->pharmacie_id) {
            return response()->json(['message' => 'Utilisateur non authentifié ou sans pharmacie associée.'], 403);
        }

        $pharmacyId = $user->pharmacie_id;
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY); // Démarre la semaine le lundi
        $endOfWeek = Carbon::now()->endOfWeek(Carbon::SUNDAY);     // Termine la semaine le dimanche

        $salesByDay = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $startOfWeek->copy()->addDays($i);
            $dayName = $date->isoFormat('ddd'); // Ex: Lun, Mar, Mer...

            // Somme des commandes acceptées pour ce jour
            $dailyCommandeSales = Commande::where('pharmacy_id', $pharmacyId)
                                          ->where('status', 'acceptée')
                                          ->whereDate('updated_at', $date)
                                          ->sum('prix_total');

            // Si vous avez ajouté `total_price` à `prescription_orders`, vous feriez ceci:
            /*
            $dailyPrescriptionSales = PrescriptionOrder::where('pharmacy_id', $pharmacyId)
                                                      ->where('status', 'acceptée')
                                                      ->whereDate('updated_at', $date)
                                                      ->sum('total_price');
            $totalDailySales = $dailyCommandeSales + $dailyPrescriptionSales;
            */
            // Sinon, nous nous basons uniquement sur les commandes.
            $totalDailySales = $dailyCommandeSales;


            $salesByDay[] = [
                'day' => $dayName,
                'sales' => (float) $totalDailySales, // Assurez-vous que c'est un flottant
            ];
        }

        return response()->json($salesByDay);
    }
}