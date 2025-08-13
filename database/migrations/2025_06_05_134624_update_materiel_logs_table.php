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
        Schema::table('materiel_logs', function (Blueprint $table) {
            // Modification des colonnes existantes
            $table->integer('quantity_added')->default(0)->change();
            $table->text('notes')->nullable(false)->change(); // Rend le champ obligatoire
            
            // Ajout des nouvelles colonnes
            $table->integer('quantity_removed')->default(0)->after('quantity_added');
            $table->string('operation_type')->after('quantity_removed');
            $table->string('destination')->nullable()->after('operation_type');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('materiel_logs', function (Blueprint $table) {
            // Annulation des modifications
            $table->integer('quantity_added')->change();
            $table->text('notes')->nullable()->change();
            
            $table->dropColumn(['quantity_removed', 'operation_type', 'destination']);
        });
    }
};
