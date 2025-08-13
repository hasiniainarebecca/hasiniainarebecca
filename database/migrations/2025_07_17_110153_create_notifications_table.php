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
        Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary(); // Utilisez UUID comme clé primaire
                $table->string('type'); // Type de la notification (nom de la classe de notification)
                $table->morphs('notifiable'); // Colonnes notifiable_type et notifiable_id pour le modèle concerné
                $table->text('data'); // Les données de la notification, souvent un JSON
                $table->timestamp('read_at')->nullable(); // Date à laquelle la notification a été lue
                $table->timestamps(); // created_at et updated_at
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('notifications');
    }
};
