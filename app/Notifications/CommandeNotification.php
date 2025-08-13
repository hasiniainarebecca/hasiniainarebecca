<?php

namespace App\Notifications;

use App\Models\Commande; // Pour les commandes sans ordonnance
use App\Models\PrescriptionOrder; // Pour les commandes avec ordonnance
use App\Models\User;
use App\Models\Pharmacie; // Pour obtenir le nom de la pharmacie
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class CommandeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $commande; // Peut être Commande ou PrescriptionOrder
    public $statut; // 'validee', 'refusee', 'nouvelle'
    public $pharmacien;
    public $pharmacie;
    public $patient;
    public $typeCommande; // 'avec_ordonnance' ou 'sans_ordonnance'

    /**
     * Crée une nouvelle instance de notification.
     *
     * @param  \App\Models\Commande|\App\Models\PrescriptionOrder  $commande
     * @param  string  $statut
     * @param  \App\Models\User|null  $pharmacien
     * @param  \App\Models\Pharmacie|null  $pharmacie
     * @param  \App\Models\User|null  $patient
     * @param  string  $typeCommande
     * @return void
     */
    public function __construct($commande, string $statut, ?User $pharmacien = null, ?Pharmacie $pharmacie = null, ?User $patient = null, string $typeCommande)
    {
        $this->commande = $commande;
        $this->statut = $statut;
        $this->pharmacien = $pharmacien;
        $this->pharmacie = $pharmacie;
        $this->patient = $patient;
        $this->typeCommande = $typeCommande;
    }

    /**
     * Obtenez les canaux de notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Obtenez la représentation de tableau de la notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray(object $notifiable): array
    {
        $message = $this->getTexteMessage($notifiable);
        $titre = $this->getTitreNotification();

        return [
            'type' => 'commande', // Type pour le frontend
            'id_commande' => $this->commande->id,
            'statut_commande' => $this->statut,
            'type_commande' => $this->typeCommande,
            'nom_pharmacien' => $this->pharmacien ? $this->pharmacien->nom . ' ' . $this->pharmacien->prenom : 'un pharmacien',
            'nom_pharmacie' => $this->pharmacie ? $this->pharmacie->nom : 'une pharmacie',
            'nom_patient' => $this->patient ? $this->patient->nom . ' ' . $this->patient->prenom : 'un patient',
            'message' => $message,
            'title' => $titre, // Ajout du titre pour le frontend
        ];
    }

    /**
     * Obtenez le texte du message en fonction du statut et du destinataire.
     *
     * @param  object  $notifiable
     * @return string
     */
    protected function getTexteMessage(object $notifiable): string
    {
        $message = "";
        $nomPharmacien = $this->pharmacien ? $this->pharmacien->nom . ' ' . $this->pharmacien->prenom : 'un pharmacien';
        $nomPharmacie = $this->pharmacie ? $this->pharmacie->nom : 'une pharmacie';
        $nomPatient = $this->patient ? $this->patient->nom . ' ' . $this->patient->prenom : 'un patient';

        // Logique pour le patient
        if ($notifiable->id === ($this->patient ? $this->patient->id : null)) {
            if ($this->statut === 'validee') {
                $message = "Votre commande a été validée par {$nomPharmacien} de la pharmacie {$nomPharmacie}.";
            } elseif ($this->statut === 'refusee') {
                $message = "Votre commande a été refusée par {$nomPharmacien} de la pharmacie {$nomPharmacie}.";
            }
        }
        // Logique pour le pharmacien (ou les pharmaciens du même établissement)
        // Si la notification est destinée à un pharmacien et que le statut est 'nouvelle'
        elseif ($notifiable->role === 'pharmacien' && $this->statut === 'nouvelle') {
            $message = "Une nouvelle commande de {$nomPatient} a été enregistrée.";
        }
        // Si la notification est destinée à un pharmacien et que le statut est 'validee' ou 'refusee'
        // (pour informer les autres pharmaciens du même établissement)
        elseif ($notifiable->role === 'pharmacien' && ($this->statut === 'validee' || $this->statut === 'refusee')) {
            $message = "La commande de {$nomPatient} a été {$this->statut} par {$nomPharmacien}.";
        }

        return $message;
    }

    /**
     * Obtenez le titre de la notification.
     *
     * @return string
     */
    protected function getTitreNotification(): string
    {
        switch ($this->statut) {
            case 'validee':
                return "Commande Validée";
            case 'refusee':
                return "Commande Refusée";
            case 'nouvelle':
                return "Nouvelle Commande";
            default:
                return "Mise à jour de commande";
        }
    }

    /**
     * Obtenez la représentation de diffusion de la notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\BroadcastMessage
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => 'commande',
            'data' => $this->toArray($notifiable),
            'read_at' => null,
            'created_at' => now()->toDateTimeString(),
        ]);
    }
}