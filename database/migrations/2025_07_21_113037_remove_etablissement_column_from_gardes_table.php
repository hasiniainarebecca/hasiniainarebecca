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
        Schema::table('gardes', function (Blueprint $table) {
        // Vérifiez si la colonne 'etablissement' existe avant de la supprimer
            if (Schema::hasColumn('gardes', 'etablissement')) {
                $table->dropColumn('etablissement');
            }
            });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('gardes', function (Blueprint $table) {
            // Pour annuler la migration, rajoutez la colonne.
            // Assurez-vous que le type et les contraintes correspondent à son état original.
            // Si elle était une chaîne de caractères, par exemple:
            $table->string('etablissement')->nullable(); // Ou non-nullable si elle l'était avant
        });
    }
};
