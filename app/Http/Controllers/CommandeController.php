<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Commande;
use App\Models\PrescriptionOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Medication;
use App\Notifications\CommandeNotification;
use App\Models\User; // Assurez-vous d'importer User
use App\Models\Pharmacie;

class CommandeController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // On suppose que le pharmacien est lié à une ou plusieurs pharmacies
        // Ici on récupère les commandes pour les pharmacies qu'il gère
        $pharmacies = $user->pharmacie()->pluck('id');

        // Mettre à jour le statut des commandes "envoyée" à "en attente"
        Commande::whereIn('pharmacy_id', $pharmacies)
                ->where('status', 'envoyée')
                ->update(['status' => 'en attente']);

        $commandes = Commande::with(['patient', 'medication'])
            ->whereIn('pharmacy_id', $pharmacies)
            ->get();

        return response()->json($commandes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'medication_id' => 'required|exists:medications,id',
            'pharmacy_id' => 'required|exists:pharmacies,id',
            'quantity' => 'required|integer|min:1',
        ]);

        // On suppose que tu récupères le prix du médicament
        $medicament = \App\Models\Medication::findOrFail($validated['medication_id']);
        $prix_unitaire = $medicament->price ?? 0;
        $prix_total = $prix_unitaire * $validated['quantity'];

        $commande = Commande::create([
            'patient_id' => Auth::id(),
            'pharmacy_id' => $validated['pharmacy_id'],
            'medication_id' => $validated['medication_id'],
            'quantity' => $validated['quantity'],
            'prix_total' => $prix_total,
            'status' => 'en attente', // J'ai remis 'en attente' comme discuté précédemment
        ]);

        // RÉCUPÉRER L'INSTANCE COMPLÈTE DU PATIENT
        $patient = Auth::user(); // Ceci retourne l'instance du modèle User, pas seulement l'ID

        $pharmacieCible = Pharmacie::find($validated['pharmacy_id']);

        // Notifier tous les pharmaciens de la pharmacie concernée
        if ($pharmacieCible) {
            $pharmaciensPharmacie = User::where('role', 'pharmacien')
                                        ->where('pharmacie_id', $pharmacieCible->id)
                                        ->get();

            foreach ($pharmaciensPharmacie as $pharmacien) {
                $pharmacien->notify(new CommandeNotification(
                    $commande,
                    'nouvelle',
                    null, // Pas de pharmacien spécifique agissant encore
                    $pharmacieCible,
                    $patient, // PASSEZ L'INSTANCE DU MODÈLE USER ICI
                    'sans_ordonnance'
                ));
            }
        }

        return response()->json([
            'message' => 'Commande créée avec succès',
            'commande' => $commande
        ], 201);
    }

    public function updateStatus(Request $request, Commande $commande) // Utilisation de l'injection de modèle
    {
        $request->validate([
            'status' => 'required|in:envoyée,en attente,acceptée,refusée,préparée,livrée,annulée',
        ]);

        // Définir $oldStatus AVANT de modifier $commande->status
        $oldStatus = $commande->status;

        $commande->status = $request->status;

        $pharmacienQuiAgit = Auth::user();

        if ($request->status === 'acceptée') {
            $medicament = Medication::find($commande->medication_id);

            if (!$medicament) {
                return response()->json(['error' => 'Médicament non trouvé'], 404);
            }

            if ($medicament->stock < $commande->quantity) {
                return response()->json(['error' => 'Stock insuffisant pour accepter cette commande'], 400);
            }

            $medicament->stock -= $commande->quantity;
            $medicament->save();
            $commande->pharmacien_id = $pharmacienQuiAgit->id;
        }

        $commande->save();

        $patient = $commande->patient;
        $pharmacie = $commande->pharmacie;

        // Notification au patient
        if ($patient && ($request->status === 'acceptée' || $request->status === 'refusée')) {
            $patient->notify(new CommandeNotification(
                $commande,
                $request->status === 'acceptée' ? 'validee' : 'refusee',
                $pharmacienQuiAgit,
                $pharmacie,
                $patient,
                'sans_ordonnance'
            ));
        }

        // Notification aux autres pharmaciens du même établissement (si le statut change)
        // et si le pharmacien qui agit et la pharmacie existent
        if ($pharmacienQuiAgit && $pharmacie && $oldStatus !== $request->status) {
            $pharmaciensDansMemePharmacie = User::where('role', 'pharmacien')
                                                ->where('pharmacie_id', $pharmacie->id)
                                                ->where('id', '!=', $pharmacienQuiAgit->id)
                                                ->get();

            foreach ($pharmaciensDansMemePharmacie as $pharma) {
                $pharma->notify(new CommandeNotification(
                    $commande,
                    $request->status === 'acceptée' ? 'validee' : 'refusee',
                    $pharmacienQuiAgit,
                    $pharmacie,
                    $patient,
                    'sans_ordonnance'
                ));
            }
        }

        return response()->json(['message' => 'Statut mis à jour avec succès', 'commande' => $commande]);
    }

    public function getSalesData(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->pharmacie) {
            return response()->json(['message' => 'Utilisateur non authentifié ou sans pharmacie associée.'], 403);
        }

        $pharmacyId = $user->pharmacie->id;
        $now = Carbon::now();

        // Daily Sales
        $dailySalesCommandes = Commande::where('pharmacy_id', $pharmacyId)
                                     ->where('status', 'acceptée')
                                     ->whereDate('updated_at', $now->toDateString())
                                     ->sum('prix_total');

        $dailySalesPrescriptionOrders = PrescriptionOrder::where('pharmacy_id', $pharmacyId)
                                                         ->where('status', 'acceptée')
                                                         ->whereDate('updated_at', $now->toDateString())
                                                         ->sum('total_price');

        $dailySales = $dailySalesCommandes + $dailySalesPrescriptionOrders;

        // Monthly Revenue
        $monthlyRevenueCommandes = Commande::where('pharmacy_id', $pharmacyId)
                                           ->where('status', 'acceptée')
                                           ->whereMonth('updated_at', $now->month)
                                           ->whereYear('updated_at', $now->year)
                                           ->sum('prix_total');

        $monthlyRevenuePrescriptionOrders = PrescriptionOrder::where('pharmacy_id', $pharmacyId)
                                                              ->where('status', 'acceptée')
                                                              ->whereMonth('updated_at', $now->month)
                                                              ->whereYear('updated_at', $now->year)
                                                              ->sum('total_price');

        $monthlyRevenue = $monthlyRevenueCommandes + $monthlyRevenuePrescriptionOrders;

        // Weekly Sales (for chart)
        $weeklySales = [];
        // Définir la locale pour Carbon pour s'assurer que les noms de jours sont en français
        Carbon::setLocale('fr'); // C'est la ligne clé pour la localisation

        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);

            // Utiliser 'ddd' pour l'abréviation localisée du jour de la semaine (Lun, Mar, Mer...)
            // Ou 'dddd' pour les noms complets (Lundi, Mardi, Mercredi...)
            $dayName = $date->isoFormat('ddd');

            $dailyTotalCommandes = Commande::where('pharmacy_id', $pharmacyId)
                                            ->where('status', 'acceptée')
                                            ->whereDate('updated_at', $date->toDateString())
                                            ->sum('prix_total');
            $dailyTotalPrescriptionOrders = PrescriptionOrder::where('pharmacy_id', $pharmacyId)
                                                             ->where('status', 'acceptée')
                                                             ->whereDate('updated_at', $date->toDateString())
                                                             ->sum('total_price');
            $totalDailySales = $dailyTotalCommandes + $dailyTotalPrescriptionOrders;

            $weeklySales[$dayName] = $totalDailySales; // Utilisez $dayName comme clé
        }

        return response()->json([
            'dailySales' => $dailySales,
            'monthlyRevenue' => $monthlyRevenue,
            'weeklySales' => array_values($weeklySales),
            'weeklyLabels' => array_keys($weeklySales), // Cela enverra les jours en français à votre frontend
        ]);
    }

    public function getSalesDataSuivis(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->pharmacie_id) {
            return response()->json(['message' => 'Utilisateur non authentifié ou sans pharmacie associée.'], 403);
        }

        $pharmacyId = $user->pharmacie_id;

        // Récupérer les paramètres de filtre de la requête
        $timeRange = $request->query('timeRange', 'weekly'); // daily, weekly, monthly
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        // Définir les dates par défaut si non fournies
        if (!$endDate) {
            $endDate = Carbon::today();
        } else {
            $endDate = Carbon::parse($endDate);
        }

        if (!$startDate) {
            // Par défaut, la semaine dernière
            $startDate = Carbon::parse($endDate)->subWeek();
        } else {
            $startDate = Carbon::parse($startDate);
        }

        // --- Données pour le graphique (daily, weekly, monthly) ---
        $salesData = [];
        $totalSales = 0;
        $totalTransactions = 0;

        // Requête de base pour les ventes acceptées pour la pharmacie et la période
        $baseQuery = Commande::where('pharmacy_id', $pharmacyId)
                             ->where('status', 'acceptée')
                             ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()]);

        switch ($timeRange) {
            case 'daily':
                $dailySales = $baseQuery->selectRaw('DATE(created_at) as date, SUM(prix_total) as sales, COUNT(id) as transactions')
                                        ->groupBy('date')
                                        ->orderBy('date')
                                        ->get();
                $salesData['dailySales'] = $dailySales->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'sales' => (float)$item->sales,
                        'transactions' => (int)$item->transactions,
                    ];
                });
                break;

            case 'weekly':
                $weeklySales = $baseQuery->selectRaw('WEEK(created_at) as week_num, YEAR(created_at) as year_num, SUM(prix_total) as sales, COUNT(id) as transactions')
                                         ->groupBy('week_num', 'year_num')
                                         ->orderBy('year_num')->orderBy('week_num')
                                         ->get();
                $salesData['weeklySales'] = $weeklySales->map(function ($item) {
                    // Pour afficher "Semaine X"
                    return [
                        'week' => "Semaine {$item->week_num}",
                        'sales' => (float)$item->sales,
                        'transactions' => (int)$item->transactions,
                    ];
                });
                break;

            case 'monthly':
                $monthlySales = $baseQuery->selectRaw('MONTH(created_at) as month_num, YEAR(created_at) as year_num, SUM(prix_total) as sales, COUNT(id) as transactions')
                                          ->groupBy('month_num', 'year_num')
                                          ->orderBy('year_num')->orderBy('month_num')
                                          ->get();
                $salesData['monthlySales'] = $monthlySales->map(function ($item) {
                    // Pour afficher "Mois Année"
                    $monthName = Carbon::createFromDate($item->year_num, $item->month_num, 1)->translatedFormat('F Y');
                    return [
                        'month' => ucfirst($monthName), // Mettre la première lettre en majuscule
                        'sales' => (float)$item->sales,
                        'transactions' => (int)$item->transactions,
                    ];
                });
                break;
        }

        // --- Produits les plus vendus (Top Products) ---
        // Jointure avec la table medications pour récupérer les noms de produits et les prix unitaires
        $topProducts = Commande::where('commandes.pharmacy_id', $pharmacyId)
                               ->where('commandes.status', 'acceptée')
                               ->whereBetween('commandes.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
                               ->join('medications', 'commandes.medication_id', '=', 'medications.id')
                               ->selectRaw('medications.name as name, SUM(commandes.quantity) as sales, SUM(commandes.prix_total) as revenue')
                               ->groupBy('medications.name')
                               ->orderByDesc('revenue')
                               ->limit(5) // Limiter aux 5 premiers produits
                               ->get();

        $salesData['topProducts'] = $topProducts->map(function ($product) {
            return [
                'id' => $product->name, // Utilisez le nom comme ID temporaire si pas d'ID unique pour le produit vendu
                'name' => $product->name,
                'sales' => (int)$product->sales,
                'revenue' => (float)$product->revenue,
            ];
        });

        return response()->json($salesData);
    }
}
