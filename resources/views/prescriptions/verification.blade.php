<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification d'ordonnance - GISS</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #2563eb;
            --success-color: #22c55e;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
            --text-primary: #333333;
            --text-secondary: #666666;
            --text-light: #888888;
            --border-color: #e5e7eb;
            --bg-light: #f9fafb;
            --bg-white: #ffffff;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }   
        
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-light);
            color: var(--text-primary);
            line-height: 1.5;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: var(--bg-white);
            border-radius: 8px;
            box-shadow: var(--shadow);
            overflow: hidden;
        }
        
        .header {
            background-color: var(--primary-color);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 5px;
        }
        
        .content {
            padding: 30px;
        }
        
        .verification-id {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .verification-id h2 {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .status-card {
            text-align: center;
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 8px;
        }
        
        .status-card.valid {
            background-color: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
        }
        
        .status-card.expired {
            background-color: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        .status-card.invalid {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        .status-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }
        
        .status-icon.valid {
            background-color: var(--success-color);
            color: white;
        }
        
        .status-icon.expired {
            background-color: var(--warning-color);
            color: white;
        }
        
        .status-icon.invalid {
            background-color: var(--danger-color);
            color: white;
        }
        
        .status-icon svg {
            width: 30px;
            height: 30px;
        }
        
        .status-card h3 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .status-card.valid h3 {
            color: var(--success-color);
        }
        
        .status-card.expired h3 {
            color: var(--warning-color);
        }
        
        .status-card.invalid h3 {
            color: var(--danger-color);
        }
        
        .status-card p {
            font-size: 16px;
            color: var(--text-secondary);
        }
        
        .prescription-details {
            margin-bottom: 30px;
        }
        
        .prescription-details h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color);
            color: var(--primary-color);
        }
        
        .detail-section {
            margin-bottom: 25px;
        }
        
        .detail-section h4 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--text-primary);
            display: flex;
            align-items: center;
        }
        
        .detail-section h4 svg {
            width: 18px;
            height: 18px;
            margin-right: 8px;
            color: var(--primary-color);
        }
        
        .detail-section p {
            margin: 8px 0;
            font-size: 14px;
            color: var(--text-secondary);
            padding-left: 26px;
        }
        
        .medications-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }
        
        .medications-list li {
            padding: 12px 15px;
            margin-bottom: 10px;
            background-color: var(--bg-light);
            border-radius: 6px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
        }
        
        .medication-name {
            font-weight: 500;
        }
        
        .medication-dosage {
            color: var(--text-light);
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
        }
        
        .footer p {
            font-size: 14px;
            color: var(--text-light);
        }
        
        .logo {
            font-size: 20px;
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 10px;
            display: inline-block;
        }
        
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: var(--primary-color);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .content {
                padding: 20px;
            }
            
            .status-card {
                padding: 20px;
            }
            
            .medications-list li {
                flex-direction: column;
            }
            
            .medication-dosage {
                margin-top: 5px;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .header {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 20px;
            }
            
            .content {
                padding: 15px;
            }
            
            .status-card {
                padding: 15px;
            }
            
            .status-icon {
                width: 50px;
                height: 50px;
            }
            
            .status-icon svg {
                width: 25px;
                height: 25px;
            }
            
            .status-card h3 {
                font-size: 18px;
            }
            
            .status-card p {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Vérification d'Ordonnance</h1>
            <p>Système de Gestion Intégrée des Soins de Santé</p>
        </div>
        
        <div class="content">
            <div class="verification-id">
                <h2>Ordonnance N° {{ isset($prescription) ? $prescription->id : 'Non trouvée' }}</h2>
            </div>
            
            <div class="status-card {{ $status }}">
                @if($status == 'valid')
                    <div class="status-icon valid">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3>Ordonnance authentique</h3>
                @elseif($status == 'expired')
                    <div class="status-icon expired">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3>Ordonnance expirée</h3>
                @else
                    <div class="status-icon invalid">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3>Ordonnance non reconnue</h3>
                @endif
                <p>{{ $message }}</p>
            </div>
            
            @if(isset($prescription) && ($status == 'valid' || $status == 'expired'))
                <div class="prescription-details">
                    <h3>Détails de l'ordonnance</h3>
                    
                    <div class="detail-section">
                        <h4>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Médecin
                        </h4>
                        <p><strong>Nom:</strong> Dr {{ $prescription->doctor->nom }} {{ $prescription->doctor->prenom }}</p>
                        <p><strong>Spécialité:</strong> {{ $prescription->doctor->speciality }}</p>
                        @if(isset($prescription->doctor->rpps))
                            <p><strong>N° RPPS:</strong> {{ $prescription->doctor->rpps }}</p>
                        @endif
                    </div>
                    
                    <div class="detail-section">
                        <h4>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Patient
                        </h4>
                        <p><strong>Nom:</strong> {{ $prescription->patient->nom }} {{ $prescription->patient->prenom }}</p>
                        @if(isset($prescription->patient->birth_date))
                            <p><strong>Date de naissance:</strong> {{ \Carbon\Carbon::parse($prescription->patient->birth_date)->format('d/m/Y') }}</p>
                        @endif
                        @if(isset($prescription->patient->security_number))
                            <p><strong>N° Sécurité Sociale:</strong> {{ $prescription->patient->security_number }}</p>
                        @endif
                    </div>
                    
                    <div class="detail-section">
                        <h4>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Dates
                        </h4>
                        <p><strong>Délivrée le:</strong> {{ \Carbon\Carbon::parse($prescription->created_at)->format('d/m/Y') }}</p>
                        @if(isset($prescription->expiry_date))
                            <p><strong>Expire le:</strong> {{ \Carbon\Carbon::parse($prescription->expiry_date)->format('d/m/Y') }}</p>
                        @else
                            <p><strong>Expire le:</strong> {{ \Carbon\Carbon::parse($prescription->created_at)->addMonths(3)->format('d/m/Y') }}</p>
                        @endif
                    </div>
                    
                    <div class="detail-section">
                        <h4>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Médicaments prescrits
                        </h4>
                        <ul class="medications-list">
                            @foreach($prescription->medications as $med)
                                <li>
                                    <span class="medication-name">{{ $med->medication_name }} {{ $med->dosage }}</span>
                                    <span class="medication-dosage">{{ $med->frequency }} par jour, {{ $med->duration }} jours</span>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                    
                    @if($prescription->notes)
                        <div class="detail-section">
                            <h4>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Notes
                            </h4>
                            <p>{{ $prescription->notes }}</p>
                        </div>
                    @endif
                </div>
            @endif
            
            <div class="footer">
                <div class="logo">GISS</div>
                <p>Cette vérification a été effectuée le {{ \Carbon\Carbon::now()->format('d/m/Y à H:i') }}</p>
                <p>Pour toute question, veuillez contacter votre professionnel de santé.</p>
            </div>
        </div>
    </div>
</body>
</html>