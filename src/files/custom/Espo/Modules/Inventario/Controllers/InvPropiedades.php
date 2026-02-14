<?php
namespace Espo\Modules\Inventario\Controllers;

use Espo\Core\Controllers\Base;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Api\Request;

class InvPropiedades extends Base
{
    /**
     * Obtener o crear inventario para una propiedad
     */
    public function getActionGetOrCreate(Request $request): array
    {
        $propiedadId = $request->getQueryParam('propiedadId');
        
        if (!$propiedadId) {
            return [
                'success' => false,
                'error' => 'propiedadId es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        // Buscar propiedad
        $propiedad = $entityManager->getEntity('Propiedades', $propiedadId);
        if (!$propiedad) {
            return [
                'success' => false,
                'error' => 'Propiedad no encontrada'
            ];
        }
        
        // Buscar inventario existente
        $inventario = $entityManager->getRepository('InvPropiedades')
            ->where(['idPropiedadId' => $propiedadId, 'deleted' => false])
            ->findOne();
        
        // Si no existe, crear nuevo
        if (!$inventario) {
            $inventario = $entityManager->getEntity('InvPropiedades');
            $inventario->set([
                'idPropiedadId' => $propiedadId,
                'name' => 'Inventario - ' . $propiedad->get('name'),
                'tipoPersona' => 'Natural',
                'buyer' => 'Comprador',
                'precio' => 'En rango',
                'ubicacion' => 'Ubicación no atractiva',
                'exclusividad' => 'Sin exclusividad',
                'apoderado' => false,
                'demanda' => 'Media demanda',
                'estatusPropiedad' => 'Rojo'
            ]);
            $entityManager->saveEntity($inventario);
        }
        
        return [
            'success' => true,
            'data' => [
                'inventario' => [
                    'id' => $inventario->get('id'),
                    'tipoPersona' => $inventario->get('tipoPersona'),
                    'buyer' => $inventario->get('buyer'),
                    'precio' => $inventario->get('precio'),
                    'ubicacion' => $inventario->get('ubicacion'),
                    'exclusividad' => $inventario->get('exclusividad'),
                    'apoderado' => $inventario->get('apoderado'),
                    'demanda' => $inventario->get('demanda'),
                    'estatusPropiedad' => $inventario->get('estatusPropiedad')
                ],
                'propiedad' => [
                    'id' => $propiedad->get('id'),
                    'name' => $propiedad->get('name'),
                    'tipoOperacion' => $propiedad->get('tipoOperacion'),
                    'tipoPropiedad' => $propiedad->get('tipoPropiedad'),
                    'subTipoPropiedad' => $propiedad->get('subTipoPropiedad'),
                    'm2C' => $propiedad->get('m2C'),
                    'm2T' => $propiedad->get('m2T'),
                    'ubicacion' => $propiedad->get('ubicacion'),
                    'asesorNombre' => $propiedad->get('asesorNombre'),
                    'fechaAlta' => $propiedad->get('fechaAlta'),
                    'status' => $propiedad->get('status')
                ]
            ]
        ];
    }
    
    /**
     * Obtener sub buyers asociados a una propiedad
     * CORREGIDO: Sin usar isRelationExists()
     */
    public function getActionGetSubBuyersPropiedad(Request $request): array
    {
        $inventarioId = $request->getQueryParam('inventarioId');
        
        if (!$inventarioId) {
            return [
                'success' => false,
                'error' => 'inventarioId es requerido'
            ];
        }
        
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            
            $inventario = $entityManager->getEntity('InvPropiedades', $inventarioId);
            if (!$inventario) {
                return [
                    'success' => false,
                    'error' => 'Inventario no encontrado'
                ];
            }
            
            $subBuyers = [];
            
            try {
                // Intentar obtener relación usando getRelation
                $repository = $entityManager->getRepository('InvPropiedades');
                $subBuyerCollection = $repository->getRelation($inventario, 'subBuyers')->find();
                
                foreach ($subBuyerCollection as $subBuyer) {
                    $subBuyers[] = [
                        'id' => $subBuyer->get('id'),
                        'name' => $subBuyer->get('name'),
                        'buyer' => $subBuyer->get('buyer')
                    ];
                }
            } catch (\Exception $e) {
                // Si falla getRelation, intentar con query directo a tabla intermedia
                $pdo = $entityManager->getPDO();
                
                $stmt = $pdo->prepare("
                    SELECT sb.id, sb.name, sb.buyer
                    FROM inv_sub_buyer sb
                    INNER JOIN inv_propiedades_inv_sub_buyer rel 
                        ON rel.inv_sub_buyer_id = sb.id
                    WHERE rel.inv_propiedades_id = :invId
                        AND rel.deleted = 0
                        AND sb.deleted = 0
                ");
                
                $stmt->execute(['invId' => $inventarioId]);
                $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                foreach ($rows as $row) {
                    $subBuyers[] = [
                        'id' => $row['id'],
                        'name' => $row['name'],
                        'buyer' => $row['buyer']
                    ];
                }
            }
            
            return [
                'success' => true,
                'data' => $subBuyers
            ];
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('Error en getSubBuyersPropiedad: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Obtener recaudos guardados para una propiedad según tipo
     */
    public function getActionGetRecaudosGuardados(Request $request): array
    {
        $propiedadId = $request->getQueryParam('propiedadId');
        $tipo = $request->getQueryParam('tipo');
        
        if (!$propiedadId || !$tipo) {
            return [
                'success' => false,
                'error' => 'propiedadId y tipo son requeridos'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        // Buscar inventario
        $inventario = $entityManager->getRepository('InvPropiedades')
            ->where(['idPropiedadId' => $propiedadId, 'deleted' => false])
            ->findOne();
        
        if (!$inventario) {
            return [
                'success' => false,
                'error' => 'Inventario no encontrado'
            ];
        }
        
        // Buscar recaudos guardados en InvPropiedadesRecaudos
        $recaudosGuardados = $entityManager->getRepository('InvPropiedadesRecaudos')
            ->join('idRecaudos')
            ->where([
                'idInvPropiedadesId' => $inventario->get('id'),
                'idRecaudos.tipo' => $tipo,
                'deleted' => false
            ])
            ->find();
        
        $recaudos = [];
        $esPorDefecto = true;
        
        foreach ($recaudosGuardados as $rel) {
            $recaudo = $rel->get('idRecaudos');
            if ($recaudo) {
                $recaudos[] = [
                    'id' => $recaudo->get('id'),
                    'name' => $recaudo->get('name'),
                    'descripcion' => $recaudo->get('descripcion') ?? '',
                    'default' => $recaudo->get('default') ?? false,
                    'tipo' => $recaudo->get('tipo'),
                    'estado' => $rel->get('estado') ?? 'Modificar/No Tiene'
                ];
                
                if (!$recaudo->get('default')) {
                    $esPorDefecto = false;
                }
            }
        }
        
        // Si NO hay recaudos guardados, cargar los por defecto
        if (count($recaudos) === 0) {
            $recaudosDefault = $entityManager->getRepository('InvRecaudos')
                ->where([
                    'tipo' => $tipo,
                    'default' => true,
                    'deleted' => false
                ])
                ->find();
            
            foreach ($recaudosDefault as $recaudo) {
                $recaudos[] = [
                    'id' => $recaudo->get('id'),
                    'name' => $recaudo->get('name'),
                    'descripcion' => $recaudo->get('descripcion') ?? '',
                    'default' => true,
                    'tipo' => $recaudo->get('tipo'),
                    'estado' => 'Modificar/No Tiene'
                ];
            }
            
            $esPorDefecto = true;
        }
        
        return [
            'success' => true,
            'data' => [
                'recaudos' => $recaudos,
                'esPorDefecto' => $esPorDefecto
            ]
        ];
    }
    
    /**
     * Obtener todos los recaudos disponibles por tipo
     */
    public function getActionGetRecaudosByTipo(Request $request): array
    {
        $tipo = $request->getQueryParam('tipo');
        
        if (!$tipo) {
            return [
                'success' => false,
                'error' => 'tipo es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        $recaudos = $entityManager->getRepository('InvRecaudos')
            ->where([
                'tipo' => $tipo,
                'deleted' => false
            ])
            ->order('name', 'ASC')
            ->find();
        
        $resultado = [];
        foreach ($recaudos as $recaudo) {
            $resultado[] = [
                'id' => $recaudo->get('id'),
                'name' => $recaudo->get('name'),
                'descripcion' => $recaudo->get('descripcion') ?? '',
                'default' => $recaudo->get('default') ?? false,
                'tipo' => $recaudo->get('tipo')
            ];
        }
        
        return [
            'success' => true,
            'data' => $resultado
        ];
    }
    
    /**
     * Obtener sub buyers disponibles por tipo de buyer
     */
    public function getActionGetSubBuyersByBuyer(Request $request): array
    {
        $buyer = $request->getQueryParam('buyer');
        
        if (!$buyer) {
            return [
                'success' => false,
                'error' => 'buyer es requerido'
            ];
        }
        
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            
            $subBuyers = $entityManager->getRepository('InvSubBuyer')
                ->where([
                    'buyer' => $buyer,
                    'deleted' => false
                ])
                ->order('name', 'ASC')
                ->find();
            
            $resultado = [];
            foreach ($subBuyers as $subBuyer) {
                $resultado[] = [
                    'id' => $subBuyer->get('id'),
                    'name' => $subBuyer->get('name'),
                    'buyer' => $subBuyer->get('buyer')
                ];
            }
            
            return [
                'success' => true,
                'data' => $resultado
            ];
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('Error en getSubBuyersByBuyer: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Guardar inventario completo
     */
    public function postActionSave(Request $request): array
    {
        $data = $request->getParsedBody();
        $inventarioId = $data['inventarioId'] ?? null;
        
        if (!$inventarioId) {
            throw new BadRequest('inventarioId es requerido');
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        $inventario = $entityManager->getEntity('InvPropiedades', $inventarioId);
        if (!$inventario) {
            throw new BadRequest('Inventario no encontrado');
        }
        
        // Actualizar campos básicos
        $updates = [
            'tipoPersona' => $data['tipoPersona'] ?? $inventario->get('tipoPersona'),
            'buyer' => $data['buyer'] ?? $data['buyerPersona'] ?? $inventario->get('buyer'),
            'demanda' => $data['demanda'] ?? $inventario->get('demanda'),
            'precio' => $data['precio'] ?? $inventario->get('precio'),
            'ubicacion' => $data['ubicacion'] ?? $inventario->get('ubicacion'),
            'exclusividad' => $data['exclusividad'] ?? $inventario->get('exclusividad'),
            'apoderado' => isset($data['apoderado']) ? 
                ($data['apoderado'] === 'true' || $data['apoderado'] === true) : 
                $inventario->get('apoderado'),
            'estatusPropiedad' => $data['estatusPropiedad'] ?? 'Rojo'
        ];
        
        $inventario->set($updates);
        $entityManager->saveEntity($inventario);
        
        // Guardar sub buyers (linkMultiple)
        if (isset($data['subBuyers']) && is_array($data['subBuyers'])) {
            $this->guardarSubBuyers($inventario, $data['subBuyers']);
        }
        
        // Guardar recaudos legales
        if (isset($data['recaudosLegal']) && is_array($data['recaudosLegal'])) {
            $this->guardarRecaudos($inventario, $data['recaudosLegal'], $data['valoresRecaudosLegal'] ?? []);
        }
        
        // Guardar recaudos mercadeo
        if (isset($data['recaudosMercadeo']) && is_array($data['recaudosMercadeo'])) {
            $this->guardarRecaudos($inventario, $data['recaudosMercadeo'], $data['valoresRecaudosMercadeo'] ?? []);
        }
        
        // Guardar recaudos apoderado
        if (isset($data['recaudosApoderado']) && is_array($data['recaudosApoderado'])) {
            $this->guardarRecaudos($inventario, $data['recaudosApoderado'], $data['valoresRecaudosApoderado'] ?? []);
        }
        
        return [
            'success' => true,
            'message' => 'Inventario guardado exitosamente'
        ];
    }
    
    /**
     * Guardar sub buyers usando linkMultiple
     * CORREGIDO: Sin usar isRelationExists()
     */
    private function guardarSubBuyers($inventario, $subBuyersIds)
    {
        $entityManager = $this->getContainer()->get('entityManager');
        $repository = $entityManager->getRepository('InvPropiedades');
        
        try {
            // Obtener sub buyers actuales
            $actuales = $repository->getRelation($inventario, 'subBuyers')->find();
            $actualesIds = [];
            foreach ($actuales as $sb) {
                $actualesIds[] = $sb->get('id');
            }
            
            // Eliminar los que ya no están
            foreach ($actualesIds as $actualId) {
                if (!in_array($actualId, $subBuyersIds)) {
                    $repository->unrelate($inventario, 'subBuyers', $actualId);
                }
            }
            
            // Agregar los nuevos
            foreach ($subBuyersIds as $newId) {
                if (!in_array($newId, $actualesIds)) {
                    $repository->relate($inventario, 'subBuyers', $newId);
                }
            }
        } catch (\Exception $e) {
            // Si falla con relación, usar método directo de BD
            $pdo = $entityManager->getPDO();
            
            // Eliminar relaciones existentes
            $stmt = $pdo->prepare("
                UPDATE inv_propiedades_inv_sub_buyer 
                SET deleted = 1 
                WHERE inv_propiedades_id = :invId
            ");
            $stmt->execute(['invId' => $inventario->get('id')]);
            
            // Insertar nuevas relaciones
            foreach ($subBuyersIds as $subBuyerId) {
                $stmt = $pdo->prepare("
                    INSERT INTO inv_propiedades_inv_sub_buyer 
                    (inv_propiedades_id, inv_sub_buyer_id, deleted) 
                    VALUES (:invId, :subBuyerId, 0)
                    ON DUPLICATE KEY UPDATE deleted = 0
                ");
                $stmt->execute([
                    'invId' => $inventario->get('id'),
                    'subBuyerId' => $subBuyerId
                ]);
            }
        }
    }
    
    /**
     * Guardar recaudos en InvPropiedadesRecaudos
     */
    private function guardarRecaudos($inventario, $recaudosArray, $valoresArray)
    {
        $entityManager = $this->getContainer()->get('entityManager');
        $inventarioId = $inventario->get('id');
        
        // Eliminar recaudos existentes de este inventario
        $existentes = $entityManager->getRepository('InvPropiedadesRecaudos')
            ->where(['idInvPropiedadesId' => $inventarioId])
            ->find();
        
        foreach ($existentes as $existente) {
            $entityManager->removeEntity($existente);
        }
        
        // IMPORTANTE: Verificar que recaudosArray es array
        if (!is_array($recaudosArray)) {
            $GLOBALS['log']->warning('guardarRecaudos recibió no-array: ' . gettype($recaudosArray));
            return;
        }
        
        // Crear nuevos registros
        foreach ($recaudosArray as $recaudoData) {
            // CORREGIDO: Verificar si es array u objeto
            if (is_object($recaudoData)) {
                // Convertir objeto a array
                $recaudoData = (array) $recaudoData;
            }
            
            if (!is_array($recaudoData)) {
                continue;
            }
            
            $recaudoId = $recaudoData['recaudoId'] ?? null;
            
            // CORREGIDO: Verificar que valoresArray sea array
            if (is_object($valoresArray)) {
                $valoresArray = (array) $valoresArray;
            }
            
            $estado = isset($valoresArray[$recaudoId]) ? 
                    $valoresArray[$recaudoId] : 
                    ($recaudoData['estado'] ?? 'Modificar/No Tiene');
            
            if (!$recaudoId) continue;
            
            try {
                $relacion = $entityManager->getEntity('InvPropiedadesRecaudos');
                $relacion->set([
                    'idInvPropiedadesId' => $inventarioId,
                    'idRecaudosId' => $recaudoId,
                    'estado' => $estado
                ]);
                
                $entityManager->saveEntity($relacion);
            } catch (\Exception $e) {
                $GLOBALS['log']->error('Error guardando recaudo ' . $recaudoId . ': ' . $e->getMessage());
            }
        }
    }
}