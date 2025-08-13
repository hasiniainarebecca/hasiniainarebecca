<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ordonnance #{{ $prescription->id }}</title>
    <style>
        @page {
            margin: 15mm; /* Réduction des marges de page */
            size: A4 portrait;
        }
        
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #333;
            line-height: 1.3; /* Réduction de l'interligne */
            font-size: 10pt; /* Réduction de la taille de police de base */
            margin: 0;
            padding: 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .header-table {
            margin-bottom: 10px; /* Réduction de la marge */
            border-bottom: 1px solid #ddd;
        }
        
        .doctor-info h2 {
            margin: 0 0 3px 0;
            color: #2563eb;
            font-size: 14pt; /* Réduction de la taille */
        }
        
        .doctor-info p {
            margin: 1px 0;
            font-size: 9pt;
            color: #555;
        }
        
        .logo {
            font-size: 18pt; /* Réduction de la taille */
            font-weight: bold;
            color: #2563eb;
            border: 2px solid #2563eb;
            padding: 5px 10px; /* Réduction du padding */
            border-radius: 4px;
            display: inline-block;
            text-align: center;
        }
        
        .title {
            text-align: center;
            margin: 10px 0; /* Réduction de la marge */
        }
        
        .title h1 {
            font-size: 16pt; /* Réduction de la taille */
            margin: 0;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 1px; /* Réduction de l'espacement */
        }
        
        .info-box {
            background-color: #f8f9fa;
            padding: 8px; /* Réduction du padding */
            border-radius: 4px;
            border: 1px solid #eee;
            margin-bottom: 10px; /* Réduction de la marge */
        }
        
        .section-title {
            margin-top: 0;
            margin-bottom: 5px; /* Réduction de la marge */
            font-size: 11pt; /* Réduction de la taille */
            color: #2563eb;
        }
        
        .info-box p {
            margin: 3px 0;
            font-size: 9pt;
        }
        
        .qr-code {
            text-align: center;
            margin-top: 5px;
        }
        
        .qr-code img {
            width: 80px; /* Réduction de la taille */
            height: 80px;
        }
        
        .qr-code p {
            margin: 2px 0 0 0;
            font-size: 7pt;
            color: #555;
        }
        
        .medication-item {
            margin-bottom: 8px; /* Réduction de la marge */
            padding-bottom: 8px;
            border-bottom: 1px dashed #ddd;
        }
        
        .medication-name {
            margin-bottom: 2px;
        }
        
        .rx-symbol {
            font-size: 14pt; /* Réduction de la taille */
            margin-right: 5px;
            color: #2563eb;
        }
        
        .medication-name h3 {
            display: inline;
            margin: 0;
            font-size: 11pt; /* Réduction de la taille */
            color: #333;
        }
        
        .medication-details {
            padding-left: 20px; /* Réduction du padding */
            font-size: 9pt;
        }
        
        .notes {
            background-color: #fff8e6;
            padding: 8px; /* Réduction du padding */
            border-radius: 4px;
            border: 1px solid #ffe0b2;
            margin-bottom: 10px; /* Réduction de la marge */
            font-size: 9pt;
        }
        
        .notes h3 {
            margin-top: 0;
            margin-bottom: 5px; /* Réduction de la marge */
            font-size: 11pt; /* Réduction de la taille */
            color: #f59e0b;
        }
        
        .renewals {
            margin-bottom: 10px; /* Réduction de la marge */
            font-size: 9pt;
        }
        
        .signature-line {
            height: 1px;
            background-color: #333;
            margin-bottom: 3px;
            width: 80%;
        }
        
        .signature p {
            font-size: 9pt;
            color: #555;
            text-align: center;
        }
        
        .legal {
            font-size: 7pt; /* Réduction de la taille */
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 5px; /* Réduction du padding */
        }
        
        .legal p {
            margin: 2px 0;
        }
        
        .authentication-note {
            font-weight: 500;
            color: #2563eb;
        }
        
        .watermark {
            text-align: center;
            font-size: 7pt; /* Réduction de la taille */
            color: #aaa;
            margin-top: 20px; /* Réduction de la marge */
        }
        
        .watermark p {
            margin: 1px 0;
        }
        
        /* Optimisation pour une seule page */
        .compact-layout {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <!-- Header with doctor info and logo -->
    <table class="header-table">
        <tr>
            <td width="70%" class="doctor-info">
                <h2>Dr {{ $prescription->doctor->nom }} {{ $prescription->doctor->prenom }}</h2>
                <p>{{ $prescription->doctor->speciality }}</p>
                @if(isset($prescription->doctor->address))
                    <p>{{ $prescription->doctor->address }}</p>
                @endif
                @if(isset($prescription->doctor->phone))
                    <p>Tél: {{ $prescription->doctor->phone }}</p>
                @endif
                @if(isset($prescription->doctor->email))
                    <p>Email: {{ $prescription->doctor->email }}</p>
                @endif
                @if(isset($prescription->doctor->rpps))
                    <p>N° RPPS: {{ $prescription->doctor->rpps }}</p>
                @endif
            </td>
            <td width="30%" align="right">
                <div class="logo">GISS</div>
            </td>
        </tr>
    </table>
    
    <!-- Title -->
    <div class="title">
        <h1>Ordonnance</h1>
    </div>
    
    <!-- Patient and date info -->
    <table>
        <tr>
            <td width="55%" style="vertical-align: top; padding-right: 10px;">
                <div class="info-box">
                    <h3 class="section-title">Patient</h3>
                    <p><strong>Nom:</strong> {{ $prescription->patient->nom }} {{ $prescription->patient->prenom }}</p>
                    @if(isset($prescription->patient->birth_date))
                        <p><strong>Date de naissance:</strong> {{ \Carbon\Carbon::parse($prescription->patient->birth_date)->format('d/m/Y') }}</p>
                    @endif
                    @if(isset($prescription->patient->address))
                        <p><strong>Adresse:</strong> {{ $prescription->patient->address }}</p>
                    @endif
                    @if(isset($prescription->patient->security_number))
                        <p><strong>N° Sécurité Sociale:</strong> {{ $prescription->patient->security_number }}</p>
                    @endif
                </div>
            </td>
            <td width="45%" style="vertical-align: top;">
                <div class="info-box">
                    <table width="100%">
                        <tr>
                            <td style="vertical-align: top;">
                                <h3 class="section-title">Informations</h3>
                                <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($prescription->created_at)->format('d/m/Y') }}</p>
                                @if(isset($prescription->expiry_date))
                                    <p><strong>Valable jusqu'au:</strong> {{ \Carbon\Carbon::parse($prescription->expiry_date)->format('d/m/Y') }}</p>
                                @else
                                    <p><strong>Valable jusqu'au:</strong> {{ \Carbon\Carbon::parse($prescription->created_at)->addMonths(3)->format('d/m/Y') }}</p>
                                @endif
                            </td>
                            <td style="vertical-align: top; text-align: right;">
                                <div class="qr-code">
                                    <img src="{{ $qrCodeSvgBase64 }}" alt="QR Code">
                                    <p>Scannez pour vérifier l'authenticité</p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>
    
    <!-- Medications -->
    <div style="margin-top: 10px;" class="compact-layout">
        @foreach ($prescription->medications as $med)
            <div class="medication-item">
                <div class="medication-name">
                    <span class="rx-symbol">℞</span>
                    <h3>{{ $med->medication_name }} {{ $med->dosage }}</h3>
                </div>
                <div class="medication-details">
                    <p><strong>Posologie:</strong> {{ $med->frequency }} par jour, pendant {{ $med->duration }} jours</p>
                    @if(isset($med->instructions))
                        <p><strong>Instructions:</strong> {{ $med->instructions }}</p>
                    @endif
                </div>
            </div>
        @endforeach
    </div>
    
    <!-- Notes -->
    @if($prescription->notes)
        <div class="notes compact-layout">
            <h3>Notes</h3>
            <p>{{ $prescription->notes }}</p>
        </div>
    @endif
    
    <!-- Renewals -->
    @if(isset($prescription->renewals))
        <div class="renewals compact-layout">
            <p><strong>Renouvellement:</strong> {{ $prescription->renewals }} fois</p>
        </div>
    @endif
    
    <!-- Footer with signature and legal info -->
    <table style="margin-top: 20px;" class="compact-layout">
        <tr>
            <td width="40%" style="vertical-align: top;">
                <div class="signature">
                    <div class="signature-line"></div>
                    <p>Signature du médecin</p>
                </div>
            </td>
            <td width="60%" style="vertical-align: top;">
                <div class="legal">
                    <p>Cette ordonnance est conforme aux dispositions du Code de la Santé Publique.</p>
                    <p>Les médicaments prescrits peuvent être remplacés par des génériques sauf mention contraire du prescripteur.</p>
                    <p class="authentication-note">Cette ordonnance comporte un QR code d'authentification. Scannez-le pour vérifier sa validité.</p>
                </div>
            </td>
        </tr>
    </table>
    
    <!-- Watermark -->
    <div class="watermark">
        <p>GISS - Système de Gestion Intégrée des Soins de Santé</p>
        <p>Document généré le {{ \Carbon\Carbon::now()->format('d/m/Y à H:i') }}</p>
        <p>Ordonnance N° {{ $prescription->id }}</p>
    </div>
</body>
</html>