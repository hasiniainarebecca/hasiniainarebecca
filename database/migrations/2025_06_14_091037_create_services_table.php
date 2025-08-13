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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nurse_id')->constrained('users')->onDelete('cascade'); // L'infirmier qui propose le service
            $table->string('title');
            $table->string('type_professionnel')->nullable();
            $table->text('description')->nullable();
            $table->string('availability')->nullable(); // Ex: "Lun-Ven 9h-18h"
            $table->string('price')->nullable(); // Ex: "50€ / visite"
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
        Schema::dropIfExists('services');
    }
};
