<?php

use Illuminate\Support\Facades\Route;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\PdfController;
use Barryvdh\DomPDF\Facade\Pdf;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

require __DIR__.'/auth.php';
Route::get('/verify-prescription/{id}', [PrescriptionController::class, 'verifyPrescription'])
    ->name('verify.prescription');

Route::get('/prescriptions/{id}/get-pdf', [PdfController::class, 'download'])
    ->middleware('auth:sanctum');


Route::get('/test-pdf', function () {
    $pdf = Pdf::loadHTML('<h1 style="color:red">Test PDF DomPDF</h1>');
    return $pdf->download('test.pdf');
});