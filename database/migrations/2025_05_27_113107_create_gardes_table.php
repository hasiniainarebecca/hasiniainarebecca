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
    public function up()
    {
        Schema::create('gardes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('infirmier_id')->constrained('users'); 
            $table->string('service');
            $table->string('etablissement');
            $table->date('date');
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->enum('statut', ['confirmée', 'en attente', 'annulée'])->default('en attente');
            $table->enum('type', ['garde nuit', 'garde jour'])->default('garde nuit');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('gardes');
    }
};
