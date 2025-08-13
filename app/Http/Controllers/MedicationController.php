<?php

namespace App\Http\Controllers;

use App\Models\Medication;
use App\Models\Pharmacie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MedicationController extends Controller
{
   public function index($pharmacie_id)
    {
        $pharmacy = Pharmacie::find($pharmacie_id);

        if (!$pharmacy) {
            return response()->json(['error' => 'Pharmacy not found'], 404);
        }

        try {
            $medications = $pharmacy->medications; // ou ->load('medications')
            return response()->json($medications);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur serveur', 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request, Pharmacie $pharmacy)
    {
        \Log::debug('User pharmacie_id: '.auth()->user()->pharmacy_id);
        \Log::debug('Request pharmacie id: '.$pharmacy->id);

        $validated = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'threshold' => 'required|integer',
            'supplier' => 'required|string',
            'expiry_date' => 'required|date',
        ]);

        $medication = $pharmacy->medications()->create($validated); // Changé $pharmacy en $pharmacie

        return response()->json($medication, 201);
    }

    public function update(Request $request, $id)
    {
        $medication = Medication::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'category' => 'sometimes|string',
            'price' => 'sometimes|numeric',
            'stock' => 'sometimes|integer',
            'threshold' => 'sometimes|integer',
            'supplier' => 'sometimes|string',
            'expiry_date' => 'sometimes|date',
        ]);

        $medication->update($validated);

        return response()->json($medication);
    }

    public function destroy($id)
    {
        $medication = Medication::findOrFail($id);
        $medication->delete();

        return response()->json(['message' => 'Médicament supprimé']);
    }
    public function getAvailableMedications()
    {
        $medications = DB::table('medications')
            ->join('pharmacies', 'medications.pharmacy_id', '=', 'pharmacies.id')
            ->select('medications.name', 'medications.id', 'medications.stock')
            ->where('medications.stock', '>', 0)
            ->distinct()
            ->get();

        return response()->json($medications);
    }
}
