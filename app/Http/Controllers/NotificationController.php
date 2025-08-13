<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Notifications\DatabaseNotification; // Importez ce modèle pour les notifications

class NotificationController extends Controller
{
    /**
     * Récupère toutes les notifications pour l'utilisateur authentifié.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $utilisateur = Auth::user();

        if (!$utilisateur) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // Récupère les notifications triées par date de création (les plus récentes en premier)
        $notifications = $utilisateur->notifications()->orderBy('created_at', 'desc')->get();

        return response()->json($notifications);
    }

    /**
     * Marque une notification spécifique comme lue.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Notifications\DatabaseNotification  $notification
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead(Request $request, DatabaseNotification $notification)
    {
        // Vérifie que l'utilisateur est bien le propriétaire de la notification
        if ($request->user()->id !== $notification->notifiable_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marquée comme lue']);
    }

    /**
     * Marque toutes les notifications de l'utilisateur comme lues.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues']);
    }

    /**
     * Récupère le nombre de notifications non lues pour l'utilisateur.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUnreadCount(Request $request)
    {
        $utilisateur = Auth::user();

        if (!$utilisateur) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $nombreNonLues = $utilisateur->unreadNotifications()->count();

        return response()->json(['count' => $nombreNonLues]);
    }
}