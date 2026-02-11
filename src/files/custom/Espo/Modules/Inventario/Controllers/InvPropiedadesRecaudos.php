<?php

namespace Espo\Modules\Inventario\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;

class InvPropiedadesRecaudos extends Record
{
    public function postActionDeleteRelacion(Request $request): array
    {
        $data = $request->getParsedBody();
        
        if (is_object($data)) {
            $data = (array) $data;
        }
        
        if (empty($data['relacionId'])) {
            return [
                'success' => false,
                'error' => 'relacionId es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        try {
            $relacion = $entityManager->getEntity('InvPropiedadesRecaudos', $data['relacionId']);
            
            if (!$relacion) {
                return [
                    'success' => false,
                    'error' => 'Relación no encontrada'
                ];
            }
            
            // Marcar como eliminado
            $relacion->set('deleted', true);
            $entityManager->saveEntity($relacion);
            
            return [
                'success' => true,
                'message' => 'Relación eliminada exitosamente'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al eliminar relación: ' . $e->getMessage()
            ];
        }
    }
}