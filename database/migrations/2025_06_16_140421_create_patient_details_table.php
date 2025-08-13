<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('patient_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->text('address')->nullable(); // Conserver si l'adresse peut être différente ou plus détaillée
            $table->string('bloodType')->nullable();
            $table->text('allergies')->nullable(); // Store as comma-separated string
            $table->text('chronicConditions')->nullable(); // Utiliser ceci comme source unique des conditions chroniques
            $table->timestamps();

            // Add unique constraint for patient_id to ensure one detail entry per patient
            $table->unique('patient_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('patient_details');
    }
};
