<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Commande;
use App\Models\PrescriptionOrder;
use App\Models\ServiceRequest; // Import the ServiceRequest model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Notifications\MessageNotification;

class MessageController extends Controller
{
    /**
     * Récupérer les conversations de l'utilisateur connecté.
     * Inclut le dernier message et le count des messages non lus.
     */
    public function getConversations(Request $request)
    {
        $user = Auth::user();

        $conversations = $user->conversations()
            ->with(['messages' => function ($query) {
                $query->latest()->take(1); // Charger le dernier message
            }, 'participants' => function ($query) use ($user) {
                $query->where('user_id', '!=', $user->id); // Charger l'autre participant
            }])
            ->get();

        $formattedConversations = $conversations->map(function ($conversation) use ($user) {
            $otherParticipant = $conversation->participants->first();
            $lastMessage = $conversation->messages->first();

            // Compter les messages non lus
            $participantPivot = $conversation->participants()->where('user_id', $user->id)->first()->pivot;
            $unreadCount = $conversation->messages()
                ->where('created_at', '>', $participantPivot->last_read_at ?? '1970-01-01 00:00:00')
                ->where('sender_id', '!=', $user->id)
                ->count();

            return [
                'id' => $conversation->uuid, // Utiliser l'UUID pour le frontend
                'user' => [
                    'id' => $otherParticipant->id ?? null,
                    'name' => $otherParticipant ? ($otherParticipant->nom . ' ' . $otherParticipant->prenom) : 'Utilisateur inconnu',
                    'avatar' => null, // Vous pouvez ajouter une logique d'avatar si nécessaire
                    'status' => 'online', // À adapter si vous avez un système de statut en temps réel
                ],
                'lastMessage' => $lastMessage ? [
                    'text' => $lastMessage->body,
                    'time' => $lastMessage->created_at->diffForHumans(),
                    'isRead' => $lastMessage->created_at <= ($participantPivot->last_read_at ?? '1970-01-01 00:00:00'),
                    'sender' => $lastMessage->sender_id === $user->id ? 'you' : 'other',
                ] : null,
                'unreadCount' => $unreadCount,
            ];
        });

        return response()->json($formattedConversations);
    }

    /**
     * Récupérer les messages d'une conversation spécifique.
     */
    public function getMessages(Request $request, $conversationUuid)
    {
        $user = Auth::user();

        $conversation = Conversation::where('uuid', $conversationUuid)
            ->with(['messages.sender', 'participants'])
            ->firstOrFail();

        // Vérifier si l'utilisateur est participant à la conversation
        if (!$conversation->participants->contains($user->id)) {
            return response()->json(['message' => 'Accès refusé à cette conversation.'], 403);
        }

        // Marquer les messages comme lus pour cet utilisateur
        $participant = $conversation->participants()->where('user_id', $user->id)->first()->pivot;
        $participant->last_read_at = now();
        $participant->save();

        $messages = $conversation->messages->map(function ($message) use ($user) {
            return [
                'id' => $message->id,
                'text' => $message->body,
                'time' => $message->created_at->format('H:i'), // Format 24h
                'sender' => $message->sender_id === $user->id ? 'you' : 'other',
            ];
        });

        $otherParticipant = $conversation->participants->filter(function ($participant) use ($user) {
            return $participant->id !== $user->id;
        })->first();


        return response()->json([
            'conversation_id' => $conversation->uuid,
            'otherUser' => $otherParticipant ? [
                'id' => $otherParticipant->id,
                'name' => $otherParticipant->nom . ' ' . $otherParticipant->prenom,
                'avatar' => null,
                'status' => 'online',
            ] : null,
            'messages' => $messages,
        ]);
    }

    /**
     * Envoyer un nouveau message dans une conversation existante.
     */
    public function sendMessage(Request $request, $conversationUuid)
    {
        $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $user = Auth::user();

        $conversation = Conversation::where('uuid', $conversationUuid)->firstOrFail();

        // Vérifier si l'utilisateur est participant à la conversation
        if (!$conversation->participants->contains($user->id)) {
            return response()->json(['message' => 'Accès refusé à cette conversation.'], 403);
        }

        $message = $conversation->messages()->create([
            'sender_id' => $user->id,
            'body' => $request->body,
        ]);

        // Mettre à jour last_read_at pour l'expéditeur
        $participant = $conversation->participants()->where('user_id', $user->id)->first()->pivot;
        $participant->last_read_at = now();
        $participant->save();

        // --- ENVOI DE LA NOTIFICATION DE MESSAGE ---
        // Trouver le destinataire du message (l'autre participant de la conversation)
        $receiver = $conversation->participants()->where('user_id', '!=', $user->id)->first();

        if ($receiver) {
            // Envoyer la notification au destinataire
            $receiver->notify(new MessageNotification($message, $user));
        }
        // --- FIN DE L'ENVOI DE LA NOTIFICATION ---

        return response()->json([
            'id' => $message->id,
            'text' => $message->body,
            'time' => $message->created_at->format('H:i'),
            'sender' => 'you',
        ]);
    }

    /**
     * Créer une nouvelle conversation ou récupérer une conversation existante.
     * Cette fonction est complexe car elle doit gérer les règles de communication.
     */
    public function startConversation(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
        ]);

        $sender = Auth::user();
        $receiver = User::findOrFail($request->receiver_id);

        // Vérifier les règles de communication
        if (!$this->canCommunicate($sender, $receiver)) {
            return response()->json(['message' => 'Non autorisé à démarrer une conversation avec cet utilisateur.'], 403);
        }

        // Chercher une conversation existante entre ces deux utilisateurs
        $conversation = $sender->conversations()
            ->whereHas('participants', function ($query) use ($receiver) {
                $query->where('user_id', $receiver->id);
            })
            ->has('participants', '=', 2) // S'assurer que c'est une conversation à deux
            ->first();

        if (!$conversation) {
            // Créer une nouvelle conversation
            $conversation = Conversation::create([]);
            $conversation->participants()->attach([
                $sender->id => ['last_read_at' => now()], // Marquer comme lu pour l'expéditeur initial
                $receiver->id => ['last_read_at' => null] // Non lu pour le destinataire
            ]);
        } else {
             // Mettre à jour last_read_at pour le sender si la conversation existe déjà
            $participant = $conversation->participants()->where('user_id', $sender->id)->first()->pivot;
            $participant->last_read_at = now();
            $participant->save();
        }

        return response()->json([
            'conversation_uuid' => $conversation->uuid,
            'message' => 'Conversation démarrée ou récupérée avec succès.',
        ], 200);
    }

    /**
     * Retourne la liste des utilisateurs avec lesquels l'utilisateur connecté peut démarrer une conversation.
     * Cette fonction respecte les règles de communication définies.
     */
    public function getAvailableChatUsers(Request $request)
    {
        $user = Auth::user();
        $availableUsers = collect();

        switch ($user->role) {
            case 'docteur':
                // Docteurs et Infirmiers de même établissement
                if ($user->etablissement_id) {
                    $availableUsers = $availableUsers->merge(
                        User::where('etablissement_id', $user->etablissement_id)
                            ->whereIn('role', ['docteur', 'infirmier'])
                            ->where('id', '!=', $user->id)
                            ->get()
                    );
                }
                // Patients ayant eu rendez-vous avec lui
                $patientIds = Appointment::where('doctor_id', $user->id)
                                        ->pluck('patient_id')
                                        ->unique();
                $availableUsers = $availableUsers->merge(User::whereIn('id', $patientIds)->get());

                // Tous les pharmaciens
                $availableUsers = $availableUsers->merge(User::where('role', 'pharmacien')->get());
                break;

            case 'patient':
                // Pharmaciens où il a commandé des médicaments
                $pharmacyIdsFromCommandes = Commande::where('patient_id', $user->id)
                                                    ->pluck('pharmacy_id')
                                                    ->unique();
                $pharmacyIdsFromPrescriptionOrders = PrescriptionOrder::where('patient_id', $user->id)
                                                                    ->pluck('pharmacy_id')
                                                                    ->unique();
                $allPharmacyIds = $pharmacyIdsFromCommandes->merge($pharmacyIdsFromPrescriptionOrders)->unique();

                $availableUsers = $availableUsers->merge(User::where('role', 'pharmacien')
                                                            ->whereIn('pharmacie_id', $allPharmacyIds)
                                                            ->get());

                // Docteurs avec qui il a eu/a un rendez-vous
                $doctorIds = Appointment::where('patient_id', $user->id)
                                        ->pluck('doctor_id')
                                        ->unique();
                $availableUsers = $availableUsers->merge(User::whereIn('id', $doctorIds)->get());

                // Infirmiers avec qui il a eu des demandes de services acceptées ou terminées
                $nurseIds = ServiceRequest::where('patient_id', $user->id)
                                        ->whereIn('status', ['accepted', 'completed'])
                                        ->pluck('nurse_id')
                                        ->unique();
                $availableUsers = $availableUsers->merge(User::whereIn('id', $nurseIds)->get());
                break;

            case 'infirmier':
                // Docteurs et Infirmiers de même établissement
                if ($user->etablissement_id) {
                    $availableUsers = $availableUsers->merge(
                        User::where('etablissement_id', $user->etablissement_id)
                            ->whereIn('role', ['docteur', 'infirmier'])
                            ->where('id', '!=', $user->id)
                            ->get()
                    );
                }
                // Tous les pharmaciens
                $availableUsers = $availableUsers->merge(User::where('role', 'pharmacien')->get());

                // Patients qui lui ont demandé un service et dont le statut est accepté ou terminé
                $patientIds = ServiceRequest::where('nurse_id', $user->id)
                                        ->whereIn('status', ['accepted', 'completed'])
                                        ->pluck('patient_id')
                                        ->unique();
                $availableUsers = $availableUsers->merge(User::whereIn('id', $patientIds)->get());
                break;

            case 'pharmacien':
                // Tous les docteurs et infirmiers inscrits
                $availableUsers = $availableUsers->merge(User::whereIn('role', ['docteur', 'infirmier'])->get());
                // Autres pharmaciens
                $availableUsers = $availableUsers->merge(User::where('role', 'pharmacien')
                                                            ->where('id', '!=', $user->id)
                                                            ->get());
                // Patients qui ont des commandes dans sa pharmacie
                if ($user->pharmacie_id) {
                    $patientIdsFromCommandes = Commande::where('pharmacy_id', $user->pharmacie_id)
                                                        ->pluck('patient_id')
                                                        ->unique();
                    $patientIdsFromPrescriptionOrders = PrescriptionOrder::where('pharmacy_id', $user->pharmacie_id)
                                                                        ->pluck('patient_id')
                                                                        ->unique();
                    $allPatientIds = $patientIdsFromCommandes->merge($patientIdsFromPrescriptionOrders)->unique();
                    $availableUsers = $availableUsers->merge(User::whereIn('id', $allPatientIds)->get());
                }
                break;

            default:
                // Pas de communication pour les autres rôles par défaut
                break;
        }

        // Filtrer les doublons et formater
        $formattedUsers = $availableUsers->unique('id')->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->nom . ' ' . $u->prenom,
                'role' => $u->role,
                'avatar' => null, // Placeholder
            ];
        })->values(); // Réindexer le tableau

        return response()->json($formattedUsers);
    }

    /**
     * Logique de vérification des permissions de communication.
     * Cette fonction est cruciale pour le contrôle d'accès.
     */
    private function canCommunicate(User $sender, User $receiver): bool
    {
        // Ne pas permettre de communiquer avec soi-même
        if ($sender->id === $receiver->id) {
            return false;
        }

        // Règles de communication
        switch ($sender->role) {
            case 'docteur':
                // Docteur -> Infirmier/Docteur du même établissement
                if (in_array($receiver->role, ['infirmier', 'docteur']) && $sender->etablissement_id === $receiver->etablissement_id) {
                    return true;
                }
                // Docteur -> Patient ayant eu rendez-vous
                if ($receiver->role === 'patient') {
                    return Appointment::where('doctor_id', $sender->id)
                                    ->where('patient_id', $receiver->id)
                                    ->exists();
                }
                // Docteur -> Pharmacien (n'importe quel pharmacien)
                if ($receiver->role === 'pharmacien') {
                    return true;
                }
                break;

            case 'patient':
                // Patient -> Pharmacien où il a commandé des médicaments
                if ($receiver->role === 'pharmacien') {
                    $hasCommande = Commande::where('patient_id', $sender->id)
                                        ->where('pharmacy_id', $receiver->pharmacie_id)
                                        ->exists();
                    $hasPrescriptionOrder = PrescriptionOrder::where('patient_id', $sender->id)
                                                            ->where('pharmacy_id', $receiver->pharmacie_id)
                                                            ->exists();
                    return $hasCommande || $hasPrescriptionOrder;
                }
                // Patient -> Docteur avec qui il a eu/a un rendez-vous
                if ($receiver->role === 'docteur') {
                    return Appointment::where('patient_id', $sender->id)
                                    ->where('doctor_id', $receiver->id)
                                    ->exists();
                }
                // Patient -> Infirmier avec qui il a eu des demandes de services acceptées ou terminées
                if ($receiver->role === 'infirmier') {
                    return ServiceRequest::where('patient_id', $sender->id)
                                        ->where('nurse_id', $receiver->id)
                                        ->whereIn('status', ['accepted', 'completed'])
                                        ->exists();
                }
                break;

            case 'infirmier':
                // Infirmier -> Docteur/Infirmier du même établissement
                if (in_array($receiver->role, ['docteur', 'infirmier']) && $sender->etablissement_id === $receiver->etablissement_id) {
                    return true;
                }
                // Infirmier -> Pharmacien (n'importe quel pharmacien)
                if ($receiver->role === 'pharmacien') {
                    return true;
                }
                // Infirmier -> Patient qui lui a demandé un service et dont le statut est accepté ou terminé
                if ($receiver->role === 'patient') {
                    return ServiceRequest::where('nurse_id', $sender->id)
                                        ->where('patient_id', $receiver->id)
                                        ->whereIn('status', ['accepted', 'completed'])
                                        ->exists();
                }
                break;

            case 'pharmacien':
                // Pharmacien -> Tous les docteurs et infirmiers
                if (in_array($receiver->role, ['docteur', 'infirmier'])) {
                    return true;
                }
                // Pharmacien -> Autres pharmaciens
                if ($receiver->role === 'pharmacien') {
                    return true;
                }
                // Pharmacien -> Patients ayant des commandes dans sa pharmacie
                if ($receiver->role === 'patient') {
                    $hasCommande = Commande::where('pharmacy_id', $sender->pharmacie_id)
                                        ->where('patient_id', $receiver->id)
                                        ->exists();
                    $hasPrescriptionOrder = PrescriptionOrder::where('pharmacy_id', $sender->pharmacie_id)
                                                            ->where('patient_id', $receiver->id)
                                                            ->exists();
                    return $hasCommande || $hasPrescriptionOrder;
                }
                break;
        }

        return false; // Par défaut, la communication n'est pas autorisée
    }
}