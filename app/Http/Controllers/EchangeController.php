<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Echange;
use App\Notifications\ScheduleNotification;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EchangeController extends Controller
{
    public function index(){
        return Echange::with(['demandeur', 'cible'])->get();
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'demandeur_id'=> 'required|exists:users,id',
            'cible_id'=> 'required|exists:users,id',
            'date_origine' => 'required|date',
            'date_cible' => 'required|date',
            'motif' => 'required|string',
        ]);

        $echange = Echange::create($validated);
        return response()->json($echange, 201);
    }
    public function valider($id)
    {
        $echange = Echange::findOrFail($id);
        $echange->update(['statut' => 'approuvée']);
        return response()->json($echange);
    }
    public function refuser($id)
    {
        $echange = Echange::findOrFail($id);
        $echange->update(['statut' => 'refusée']);
        return response()->json($echange);
    }
}
