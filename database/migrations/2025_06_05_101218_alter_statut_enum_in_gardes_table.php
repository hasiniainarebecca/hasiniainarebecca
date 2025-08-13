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
        DB::statement("ALTER TABLE gardes MODIFY statut ENUM('en attente', 'confirmée', 'refusée') DEFAULT 'en attente'");
    }


    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement("ALTER TABLE gardes MODIFY statut ENUM('en attente', 'confirmée', 'annulée) DEFAULT 'en attente'");
    }
};
