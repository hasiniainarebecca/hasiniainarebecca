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
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();

        $table->foreignId('patient_id')
              ->constrained('users')
              ->onDelete('cascade');

        $table->foreignId('pharmacy_id')
              ->constrained('pharmacies')
              ->onDelete('cascade');

        $table->foreignId('pharmacien_id')
              ->nullable()
              ->constrained('users')
              ->onDelete('set null');

        $table->foreignId('medication_id')
              ->constrained('medications')
              ->onDelete('cascade');

        $table->integer('quantity')->unsigned();
        $table->decimal('prix_total', 10, 2);
        
        $table->enum('status', ['envoyée','en attente', 'acceptée', 'refusée'])->default('envoyée');
        $table->text('note')->nullable();

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
        Schema::dropIfExists('commandes');
    }
};
