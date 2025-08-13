<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileDownloadController extends Controller
{
    public function downloadExamFile($fileName)
    {
        $path = 'private_exams/' . $fileName; // Adjust this path if your files are stored differently

        if (!Storage::exists($path)) {
            return response()->json(['message' => 'Fichier non trouvé.'], 404);
        }

        // Get the file's MIME type
        $mimeType = Storage::mimeType($path);
        
        // Use StreamedResponse for large files or direct download
        return Storage::download($path, $fileName, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }
}