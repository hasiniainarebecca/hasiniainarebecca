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
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade'); // Le service demandé
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade'); // Le patient qui fait la demande
            $table->foreignId('nurse_id')->constrained('users')->onDelete('cascade'); // L'infirmier ciblé par la demande (facilite la recherche)
            $table->date('requested_date');
            $table->time('requested_time');
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected', 'cancelled', 'completed'])->default('pending');
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
        Schema::dropIfExists('service_requests');
    }
};
