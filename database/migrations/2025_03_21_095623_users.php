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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->string('sexe');
            $table->string('email')->unique();
            $table->string('phone')->unique();
            $table->string('photo')->nullable();
            $table->string('role');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->date('date_naissance')->nullable();
            $table->string('medical_id')->nullable();
            $table->string('medical_history')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('speciality')->nullable();
            $table->string('licence_number')->nullable();
            $table->integer('annee_experience')->nullable();
            $table->string('cv')->nullable();
            $table->string('disponibilite')->nullable();
            $table->string('poste')->nullable();
            $table->integer('experience_year')->nullable();
            $table->string('skills')->nullable();
            $table->string('horaire')->nullable();
            $table->rememberToken();
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
        Schema::dropIfExists('users');
    }
};
