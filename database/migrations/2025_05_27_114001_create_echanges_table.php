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
        Schema::create('echanges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demandeur_id')->constrained('users');
            $table->foreignId('cible_id')->constrained('users');
            $table->date('date_origine');
            $table->date('date_cible');
            $table->text('motif');
            $table->enum('statut', ['en attente', 'approuvée', 'refusée'])->default('en attente');
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
        Schema::dropIfExists('echanges');
    }
};
