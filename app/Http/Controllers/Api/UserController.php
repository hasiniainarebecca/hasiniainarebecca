<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Pharmacie;
use Illuminate\Http\Request;
use App\Models\Etablissement;

class UserController extends Controller
{
    function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        $user = Auth::user();
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => $user
        ]);
    }

    public function getConnectedDoctorId()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if ($user->role !== 'docteur') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json(['doctor_id' => $user->id]);
    }

    public function getDoctorInfo($doctorId)
    {
        $doctor = User::findOrFail($doctorId);
        return response()->json($doctor);
    }

    public function hasRole($role)
    {
        return $this->role === $role;
    }

    public function toggleAvailability($id)
    {
        $user = User::findOrFail($id);

        if ($user->role !== 'docteur') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $user->is_available = !$user->is_available;
        $user->save();

        return response()->json([
            'message' => 'Disponibilité mise à jour',
            'is_available' => $user->is_available // Renvoi de l'état actuel de la disponibilité
        ]);
    }

    
    public function store(Request $request)
    {
        // Validation de base commune à tous les utilisateurs
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:patient,docteur,infirmier,pharmacien',
            'sexe' => 'nullable|string',
            'phone' => 'nullable|string',
            'photo' => 'nullable|file|image',
            'is_available' => 'nullable|boolean',
            // CORRECTION: Validation conditionnelle pour les établissements
            'etablissement_id' => 'nullable|exists:etablissements,id',
            'nouvel_etablissement' => 'nullable|boolean',
            'nom_etablissement' => 'required_if:nouvel_etablissement,1|string|max:255',
            'adresse_etablissement' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Validation spécifique pour les docteurs/infirmiers
        if (in_array($request->role, ['docteur', 'infirmier'])) {
            // Vérifier qu'on a soit un etablissement_id soit un nouvel établissement
            if (!$request->etablissement_id && !$request->nouvel_etablissement) {
                return response()->json([
                    'etablissement' => ['Un établissement est requis pour ce rôle. Veuillez sélectionner un établissement existant ou créer un nouveau.']
                ], 400);
            }

            // Si on a les deux, c'est une erreur
            if ($request->etablissement_id && $request->nouvel_etablissement) {
                return response()->json([
                    'etablissement' => ['Veuillez choisir soit un établissement existant, soit créer un nouveau, mais pas les deux.']
                ], 400);
            }

            // Si nouvel établissement, vérifier que le nom est fourni
            if ($request->nouvel_etablissement && !$request->nom_etablissement) {
                return response()->json([
                    'nom_etablissement' => ['Le nom de l\'établissement est requis.']
                ], 400);
            }
        }

        // Si c'est un pharmacien, on valide les champs supplémentaires
        if ($request->role === 'pharmacien') {
            $pharmacienValidator = Validator::make($request->all(), [
                'diplome' => 'required|string',
                'certification' => 'required|file|mimes:pdf,jpg,png',
                'licence_number' => 'required|string',
                'nouvelle_pharmacie' => 'required|boolean',
                'nom_pharmacie' => 'required_if:nouvelle_pharmacie,true',
                'adresse_pharmacie' => 'required_if:nouvelle_pharmacie,true',
                'horaires_pharmacie' => 'required_if:nouvelle_pharmacie,true',
                'type_pharmacie' => 'required_if:nouvelle_pharmacie,true',
                'pharmacie_existante' => 'required_if:nouvelle_pharmacie,false|nullable|exists:pharmacies,id',
            ]);

            if ($pharmacienValidator->fails()) {
                return response()->json($pharmacienValidator->errors(), 400);
            }
        }

        DB::beginTransaction();
        try {
            $data = $validator->validated();
            $role = $data['role'];

            // Traitement spécifique pour les établissements (docteurs/infirmiers)
            $etablissementId = null;
            if (in_array($role, ['docteur', 'infirmier'])) {
                if ($request->nouvel_etablissement) {
                    // Créer un nouvel établissement
                    $etablissement = Etablissement::create([
                        'name' => $request->nom_etablissement,
                        'address' => $request->adresse_etablissement ?? null,
                    ]);
                    $etablissementId = $etablissement->id;
                    Log::info("Nouvel établissement créé", [
                        'etablissement_id' => $etablissement->id,
                        'nom' => $etablissement->name
                    ]);
                } else {
                    // Utiliser l'établissement existant
                    $etablissementId = $request->etablissement_id;
                    Log::info("Utilisation établissement existant", ['etablissement_id' => $etablissementId]);
                }
            }

            // Traitement spécifique pour les pharmaciens
            $pharmacieId = null;
            if ($role === 'pharmacien') {
                if ($request->nouvelle_pharmacie) {
                    $pharmacie = Pharmacie::create([
                        'nom' => $request->nom_pharmacie,
                        'adresse' => $request->adresse_pharmacie,
                        'horaires' => $request->horaires_pharmacie,
                        'type' => $request->type_pharmacie,
                        'verifie' => false
                    ]);
                    $pharmacieId = $pharmacie->id;
                } else {
                    $pharmacieId = $request->pharmacie_existante;
                }
            }

            // Création de l'utilisateur avec les champs communs
            $userData = [
                'nom' => $data['nom'],
                'prenom' => $data['prenom'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $role,
                'sexe' => $data['sexe'] ?? null,
                'phone' => $data['phone'] ?? null,
                'is_available' => $data['is_available'] ?? false,
            ];

            // Ajouter l'établissement pour docteurs/infirmiers
            if (in_array($role, ['docteur', 'infirmier'])) {
                $userData['etablissement_id'] = $etablissementId;
            }

            // Gestion des fichiers (photo)
            if ($request->hasFile('photo')) {
                $userData['photo'] = $request->file('photo')->store('profiles');
            }

            // Champs spécifiques aux pharmaciens
            if ($role === 'pharmacien') {
                $userData['diplome'] = $request->diplome;
                $userData['certification'] = $request->file('certification')->store('certifications');
                $userData['licence_number'] = $request->licence_number;
                $userData['pharmacie_id'] = $pharmacieId;
            }

            // Champs spécifiques aux autres rôles
            $optionalFields = [
                'date_naissance', 'medical_id', 'medical_history', 'emergency_contact',
                'speciality', 'cv', 'disponibilite', 'poste', 'experience_year',
                'skills', 'horaire'
            ];

            foreach ($optionalFields as $field) {
                if ($request->has($field)) {
                    $userData[$field] = $request->$field;
                }
            }

            $user = User::create($userData);

            DB::commit();

            Log::info("Nouvel utilisateur créé avec succès", [
                'user_id' => $user->id,
                'role' => $user->role,
                'etablissement_id' => $etablissementId ?? 'N/A'
            ]);
            
            return response()->json([
                'message' => 'Utilisateur créé avec succès',
                'user' => $user,
                'token' => $user->createToken('auth_token')->plainTextToken
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur création utilisateur: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Erreur lors de la création: ' . $e->getMessage()], 500);
        }
    }


    public function index(Request $request)
    {
        $query = User::query();

        // Filtrer par rôle si spécifié
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->select('id', 'nom', 'prenom', 'role', 'email')->get();

        // Transformer les données pour correspondre au format attendu par le frontend
        $transformedUsers = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->nom . ' ' . $user->prenom,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'role' => $user->role,
                'email' => $user->email,
            ];
        });

        return response()->json($transformedUsers);
    }

    /**
     * Récupérer spécifiquement les infirmiers
     */
    public function getInfirmiers(Request $request)
    {
        $query = User::where('role', 'infirmier');

        if ($request->has('etablissement_id')) {
            $query->where('etablissement_id', $request->etablissement_id);
        }

        $infirmiers = $query->select('id', 'nom', 'prenom', 'role', 'email')->get();

        $transformedInfirmiers = $infirmiers->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->nom . ' ' . $user->prenom,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'role' => $user->role,
                'email' => $user->email,
                'etablissement_id' => $user->etablissement_id
            ];
        });

        return response()->json($transformedInfirmiers);
    }
}
