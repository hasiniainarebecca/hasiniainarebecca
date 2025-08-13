<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PrescriptionOrder;
use App\Models\Medication;
use App\Notifications\CommandeNotification;
use App\Models\User; // Assurez-vous d'importer User
use App\Models\Pharmacie;
use Illuminate\Support\Facades\Auth;

class PrescriptionOrderController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'prescription_id' => 'required|exists:prescriptions,id',
            'patient_id' => 'required|exists:users,id',
            'pharmacy_id' => 'required|exists:pharmacies,id',
        ]);

        // Vérifie si une commande existe déjà pour cette ordonnance
        if (PrescriptionOrder::where('prescription_id', $request->prescription_id)->exists()) {
            return response()->json(['message' => 'Cette ordonnance a déjà été commandée.'], 409);
        }

        $order = PrescriptionOrder::create([
            'prescription_id' => $request->prescription_id,
            'patient_id' => $request->patient_id,
            'pharmacy_id' => $request->pharmacy_id,
            'status' => 'en attente',
            'ordered_at' => now(),
            'total_price' => 0,
        ]);

        $patient = User::find($request->patient_id);
        $pharmacieCible = Pharmacie::find($request->pharmacy_id);

        // Notifier tous les pharmaciens de la pharmacie concernée
        if ($pharmacieCible) {
            $pharmaciensPharmacie = User::where('role', 'pharmacien')
                                        ->where('pharmacie_id', $pharmacieCible->id)
                                        ->get();

            foreach ($pharmaciensPharmacie as $pharmacien) {
                $pharmacien->notify(new CommandeNotification(
                    $order,
                    'nouvelle',
                    null, // Pas de pharmacien spécifique agissant encore
                    $pharmacieCible,
                    $patient,
                    'avec_ordonnance'
                ));
            }
        }

        return response()->json($order, 201);
    }
    public function index()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        if (!$user->pharmacie_id) {
            return response()->json(['message' => 'Aucune pharmacie associée à cet utilisateur.'], 403);
        }

        $orders = PrescriptionOrder::with(['prescription.patient', 'prescription.doctor', 'prescription.medications'])
            ->where('pharmacy_id', $user->pharmacie_id)
            ->get();

        return response()->json($orders);
    }
    public function updateStatus($id, Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        if (!$user->pharmacie_id) {
            return response()->json([
                'message' => 'Pharmacie introuvable pour ce pharmacien.',
                'user' => $user // DEBUG
            ], 400);
        }

        $pharmacyId = $user->pharmacie_id;
        $order = PrescriptionOrder::with(['prescription.medications', 'patient', 'pharmacy'])->findOrFail($id);

        $oldStatus = $order->status; // Sauvegardez l'ancien statut

        if ($request->status === 'refusée') {
            $order->status = 'refusée';
            $order->save();

            // Notification au patient
            $order->patient->notify(new CommandeNotification(
                $order,
                'refusee',
                $user, // Le pharmacien qui refuse
                $order->pharmacy,
                $order->patient,
                'avec_ordonnance'
            ));

            // Notification aux autres pharmaciens du même établissement
            $pharmaciensDansMemePharmacie = User::where('role', 'pharmacien')
                                                ->where('pharmacie_id', $order->pharmacy->id)
                                                ->where('id', '!=', $user->id) // Exclure le pharmacien qui a agi
                                                ->get();
            foreach ($pharmaciensDansMemePharmacie as $pharma) {
                $pharma->notify(new CommandeNotification(
                    $order,
                    'refusee',
                    $user,
                    $order->pharmacy,
                    $order->patient,
                    'avec_ordonnance'
                ));
            }

            return response()->json(['message' => 'Ordonnance refusée.']);
        }

        // Vérification des stocks
        $errors = [];
        $totalPrice = 0;

        foreach ($order->prescription->medications as $medication) {
            $medName = trim($medication->medication_name); // 🔥 nettoyage ici
            $stock = Medication::where('name', $medName)
                            ->where('pharmacy_id', $pharmacyId)
                            ->first();

            if (!$stock) {
                $errors[] = "Le médicament '{$medName}' n'existe pas dans le stock.";
                continue;
            }

            $requiredQuantity = $medication->frequency * $medication->duration;

            if ($stock->stock < $requiredQuantity) {
                $errors[] = "Stock insuffisant pour '{$medName}'. Stock actuel : {$stock->stock}, requis : {$requiredQuantity}.";
            }

            $totalPrice += $stock->price * $requiredQuantity;
        }

        if (count($errors) > 0) {
            return response()->json([
                'success' => false,
                'messages' => $errors
            ], 400);
        }

        // Décrémentation du stock
        foreach ($order->prescription->medications as $medication) {
            $medName = trim($medication->medication_name); // 🔥 nettoyage ici aussi
            $stock = Medication::where('name', $medName)
                            ->where('pharmacy_id', $pharmacyId)
                            ->first();

            $requiredQuantity = $medication->frequency * $medication->duration;
            $stock->stock -= $requiredQuantity;
            $stock->save();
         }

         $order->status = 'acceptée';
        $order->total_price = $totalPrice;
         $order->save();

         // Notification au patient
        $order->patient->notify(new CommandeNotification(
            $order,
            'validee',
            $user, // Le pharmacien qui valide
            $order->pharmacy,
            $order->patient,
            'avec_ordonnance'
        ));

        // Notification aux autres pharmaciens du même établissement
        if ($user && $order->pharmacy && $oldStatus !== 'acceptée') { // Ne notifier que si le statut change
            $pharmaciensDansMemePharmacie = User::where('role', 'pharmacien')
                                                ->where('pharmacie_id', $order->pharmacy->id)
                                                ->where('id', '!=', $user->id) // Exclure le pharmacien qui a agi
                                                ->get();

            foreach ($pharmaciensDansMemePharmacie as $pharma) {
                $pharma->notify(new CommandeNotification(
                    $order,
                    'validee',
                    $user,
                    $order->pharmacy,
                    $order->patient,
                    'avec_ordonnance'
                ));
            }
        }


         return response()->json([
             'success' => true,
             'message' => 'Ordonnance acceptée et stock mis à jour.',
             'order' => $order // Retourne la commande mise à jour
        ]);
     }

    public function getTotalMedicines(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->pharmacie) {
            return response()->json(['message' => 'Utilisateur non authentifié ou sans pharmacie associée.'], 403);
        }

        $pharmacyId = $user->pharmacie->id;
        $totalMedicines = Medication::where('pharmacy_id', $pharmacyId)->count();

        return response()->json(['totalMedicines' => $totalMedicines]);
    }


}
