<?php

namespace Espo\Modules\Inventario\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;

class InvPropiedades extends Record
{
    /**
     * Obtener información de la propiedad
     */
    public function getActionGetPropiedadInfo(Request $request): array
    {
        $propiedadId = $request->getQueryParam('propiedadId');
        
        if (!$propiedadId) {
            return [
                'success' => false,
                'error' => 'propiedadId es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        $propiedad = $entityManager->getEntity('Propiedades', $propiedadId);
        
        if (!$propiedad) {
            return [
                'success' => false,
                'error' => 'Propiedad no encontrada'
            ];
        }
        
        // Obtener datos del asesor
        $asesorNombre = null;
        $assignedUser = $propiedad->get('assignedUser');
        if ($assignedUser) {
            $asesorNombre = $assignedUser->get('name');
        }
        
        // Obtener datos de ubicación
        $ubicacion = [];
        if ($propiedad->get('calle')) $ubicacion[] = $propiedad->get('calle');
        if ($propiedad->get('numero')) $ubicacion[] = $propiedad->get('numero');
        if ($propiedad->get('urbanizacion')) $ubicacion[] = $propiedad->get('urbanizacion');
        if ($propiedad->get('ciudad')) $ubicacion[] = $propiedad->get('ciudad');
        
        return [
            'success' => true,
            'data' => [
                'id' => $propiedad->get('id'),
                'name' => $propiedad->get('name'),
                'tipoOperacion' => $propiedad->get('tipoOperacion'),
                'tipoPropiedad' => $propiedad->get('tipoPropiedad'),
                'subTipoPropiedad' => $propiedad->get('subTipoPropiedad'),
                'm2C' => $propiedad->get('m2C'),
                'm2T' => $propiedad->get('m2T'),
                'calle' => $propiedad->get('calle'),
                'numero' => $propiedad->get('numero'),
                'urbanizacion' => $propiedad->get('urbanizacion'),
                'ciudad' => $propiedad->get('ciudad'),
                'estado' => $propiedad->get('estado'),
                'asesorNombre' => $asesorNombre,
                'fechaAlta' => $propiedad->get('fechaAlta'),
                'status' => $propiedad->get('status')
            ]
        ];
    }
}