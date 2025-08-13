<?php

namespace App\Notifications;

use App\Models\Service;
    use App\Models\ServiceRequest;
    use App\Models\User;
    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Notifications\Notification;
    use Illuminate\Notifications\Messages\BroadcastMessage;
    use Carbon\Carbon;

    class ServiceNotification extends Notification implements ShouldQueue
    {
        use Queueable;

        public $type_notification; // 'nouveau_service', 'demande_acceptee', 'demande_refusee', 'rappel_rdv_infirmier'
        public $service; // Peut être null si c'est un rappel de rdv
        public $serviceRequest; // Peut être null si c'est un nouveau service
        public $notifier; // L'utilisateur qui déclenche (ex: l'infirmier qui accepte, ou le patient qui fait la demande)

        /**
         * Create a new notification instance.
         *
         * @param  string  $type_notification
         * @param  \App\Models\Service|null  $service
         * @param  \App\Models\ServiceRequest|null  $serviceRequest
         * @param  \App\Models\User|null  $notifier
         * @return void
         */
        public function __construct(string $type_notification, ?Service $service = null, ?ServiceRequest $serviceRequest = null, ?User $notifier = null)
        {
            $this->type_notification = $type_notification;
            $this->service = $service;
            $this->serviceRequest = $serviceRequest;
            $this->notifier = $notifier; // L'utilisateur qui est la source de l'action
        }

        /**
         * Get the notification's delivery channels.
         *
         * @param  mixed  $notifiable
         * @return array
         */
        public function via(object $notifiable): array
        {
            return ['database', 'broadcast'];
        }

        /**
         * Get the array representation of the notification.
         *
         * @param  mixed  $notifiable
         * @return array
         */
        public function toArray(object $notifiable): array
        {
            $title = "Notification de service";
            $message = "Mise à jour concernant un service.";
            $icon = 'bell'; // Icône par défaut

            switch ($this->type_notification) {
                case 'nouveau_service':
                    $nurseName = $this->service->nurse->nom . ' ' . $this->service->nurse->prenom;
                    $timeDiff = Carbon::parse($this->service->created_at)->locale('fr')->diffForHumans();
                    $title = "Nouveau Service Disponible";
                    $message = "Un nouveau service a été publié par Inf. {$nurseName} il y a {$timeDiff}.";
                    $icon = 'plus-circle'; // Icône pour nouveau service
                    break;

                case 'demande_acceptee':
                    $serviceName = $this->serviceRequest->service->title ?? 'Service Inconnu';
                    $nurseName = $this->serviceRequest->nurse ? "Inf. {$this->serviceRequest->nurse->prenom} {$this->serviceRequest->nurse->nom}" : "un infirmier";
                    $title = "Demande de Service Acceptée";
                    $message = "Votre demande de \"{$serviceName}\" avec {$nurseName} a été acceptée.";
                    $icon = 'check-circle'; // Icône pour demande acceptée
                    break;

                case 'demande_refusee':
                    $serviceName = $this->serviceRequest->service->title ?? 'Service Inconnu';
                    $nurseName = $this->serviceRequest->nurse ? "Inf. {$this->serviceRequest->nurse->prenom} {$this->serviceRequest->nurse->nom}" : "un infirmier";
                    $title = "Demande de Service Refusée";
                    $message = "Votre demande de \"{$serviceName}\" avec {$nurseName} a été refusée.";
                    $icon = 'x-circle'; // Icône pour demande refusée
                    break;

                case 'rappel_rdv_infirmier':
                    $patientName = $this->serviceRequest->patient ? "{$this->serviceRequest->patient->prenom} {$this->serviceRequest->patient->nom}" : "un patient";
                    $requestedTime = Carbon::parse($this->serviceRequest->requested_time)->format('H:i');
                    $title = "Rappel de Rendez-vous Service";
                    $message = "Votre rendez-vous avec {$patientName} est pour demain à {$requestedTime}. Ne le ratez pas !";
                    $icon = 'calendar'; // Icône pour rappel de rendez-vous
                    break;
            }

            return [
                'type' => 'service_event', // Type générique pour les événements de service
                'event_type' => $this->type_notification, // Type spécifique de l'événement
                'service_id' => $this->service ? $this->service->id : null,
                'service_request_id' => $this->serviceRequest ? $this->serviceRequest->id : null,
                'notifier_id' => $this->notifier ? $this->notifier->id : null,
                'notifier_name' => $this->notifier ? "{$this->notifier->nom} {$this->notifier->prenom}" : null,
                'title' => $title,
                'message' => $message,
                'icon' => $icon,
                'time' => now()->toDateTimeString(),
            ];
        }

        /**
         * Get the broadcastable representation of the notification.
         *
         * @param  mixed  $notifiable
         * @return \Illuminate\Notifications\Messages\BroadcastMessage
         */
        public function toBroadcast(object $notifiable): BroadcastMessage
        {
            return new BroadcastMessage([
                'id' => $this->id,
                'type' => 'service_event',
                'data' => $this->toArray($notifiable),
                'read_at' => null,
                'created_at' => now()->toDateTimeString(),
            ]);
        }
    }
