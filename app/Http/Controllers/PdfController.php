<?php
namespace App\Http\Controllers;

use App\Models\Prescription;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class PdfController extends Controller
{
    public function download($id)
    {
        $prescription = Prescription::with(['doctor', 'patient', 'medications'])->findOrFail($id);

        $verificationUrl = route('verify.prescription', ['id' => $prescription->id]);

        // Générer le QR Code en SVG
        $qrCodeSvg = QrCode::format('svg')->size(200)->generate($verificationUrl);

        // Encodage en base64
        $qrCodeBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg);

        $pdf = Pdf::loadView('pdf.prescription', [
            'prescription' => $prescription,
            'qrCodeSvgBase64' => $qrCodeBase64
        ]);

        return $pdf->download('ordonnance_' . $prescription->id . '.pdf');
    }
}
