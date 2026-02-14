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
        
        $propiedad = $entityManager->getEntity('Propiedades', $propiedadId);
        if (!$propiedad) {
            return [
                'success' => false,
                'error' => 'Propiedad no encontrada'
            ];
        }
        
        $inventario = $entityManager->getRepository('InvPropiedades')
            ->where(['idPropiedadId' => $propiedadId, 'deleted' => false])
            ->findOne();
        
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
        
        $inventario = $entityManager->getRepository('InvPropiedades')
            ->where(['idPropiedadId' => $propiedadId, 'deleted' => false])
            ->findOne();
        
        if (!$inventario) {
            return [
                'success' => false,
                'error' => 'Inventario no encontrado'
            ];
        }
        
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
     * Guardar inventario completo - VERSIÓN 3 INCREMENTAL
     */
    public function postActionSave(Request $request): array
    {
        $data = $request->getParsedBody();
        
        if (is_object($data)) {
            $data = json_decode(json_encode($data), true);
        }
        
        $GLOBALS['log']->info('=== SAVE V3 INICIADO ===');
        
        $inventarioId = $data['inventarioId'] ?? null;
        
        if (!$inventarioId) {
            throw new BadRequest('inventarioId es requerido');
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        $inventario = $entityManager->getEntity('InvPropiedades', $inventarioId);
        if (!$inventario) {
            throw new BadRequest('Inventario no encontrado');
        }
        
        // Calcular notas
        $notaLegal = $this->calcularNota($data, 'legal');
        $notaMercadeo = $this->calcularNota($data, 'mercadeo');
        $notaPrecio = $this->mapearNotaOtros($data['precio'] ?? 'En rango');
        $notaExclusiva = $this->mapearNotaOtros($data['exclusividad'] ?? 'Sin exclusividad');
        $notaUbicacion = $this->mapearNotaOtros($data['ubicacion'] ?? 'Ubicación no atractiva');
        
        $GLOBALS['log']->info('📊 Notas - Legal: ' . $notaLegal . ', Mercadeo: ' . $notaMercadeo);
        
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
            'estatusPropiedad' => $data['estatusPropiedad'] ?? 'Rojo',
            'notaLegal' => $notaLegal,
            'notaMercadeo' => $notaMercadeo,
            'notaPrecio' => $notaPrecio,
            'notaExclusiva' => $notaExclusiva,
            'notaUbicacion' => $notaUbicacion
        ];
        
        $inventario->set($updates);
        $entityManager->saveEntity($inventario);
        
        $GLOBALS['log']->info('✅ Inventario básico guardado');
        
        // Guardar sub buyers
        if (isset($data['subBuyers']) && is_array($data['subBuyers'])) {
            $this->guardarSubBuyers($inventario, $data['subBuyers']);
            $GLOBALS['log']->info('✅ Sub buyers guardados');
        }
        
        // Guardar recaudos - INCREMENTAL
        $totalGuardados = 0;
        $totalActualizados = 0;
        $totalEliminados = 0;
        
        if (isset($data['recaudosLegal'])) {
            $result = $this->guardarRecaudosIncremental(
                $inventario, 
                $data['recaudosLegal'], 
                $data['valoresRecaudosLegal'] ?? []
            );
            $totalGuardados += $result['creados'];
            $totalActualizados += $result['actualizados'];
            $totalEliminados += $result['eliminados'];
            $GLOBALS['log']->info('✅ Legal - Creados: ' . $result['creados'] . ', Actualizados: ' . $result['actualizados'] . ', Eliminados: ' . $result['eliminados']);
        }
        
        if (isset($data['recaudosMercadeo'])) {
            $result = $this->guardarRecaudosIncremental(
                $inventario, 
                $data['recaudosMercadeo'], 
                $data['valoresRecaudosMercadeo'] ?? []
            );
            $totalGuardados += $result['creados'];
            $totalActualizados += $result['actualizados'];
            $totalEliminados += $result['eliminados'];
            $GLOBALS['log']->info('✅ Mercadeo - Creados: ' . $result['creados'] . ', Actualizados: ' . $result['actualizados'] . ', Eliminados: ' . $result['eliminados']);
        }
        
        if (isset($data['recaudosApoderado'])) {
            $result = $this->guardarRecaudosIncremental(
                $inventario, 
                $data['recaudosApoderado'], 
                $data['valoresRecaudosApoderado'] ?? []
            );
            $totalGuardados += $result['creados'];
            $totalActualizados += $result['actualizados'];
            $totalEliminados += $result['eliminados'];
            $GLOBALS['log']->info('✅ Apoderado - Creados: ' . $result['creados'] . ', Actualizados: ' . $result['actualizados'] . ', Eliminados: ' . $result['eliminados']);
        }
        
        $GLOBALS['log']->info('=== GUARDADO COMPLETADO ===');
        $GLOBALS['log']->info('Total - Creados: ' . $totalGuardados . ', Actualizados: ' . $totalActualizados . ', Eliminados: ' . $totalEliminados);
        
        return [
            'success' => true,
            'message' => 'Inventario guardado exitosamente',
            'stats' => [
                'creados' => $totalGuardados,
                'actualizados' => $totalActualizados,
                'eliminados' => $totalEliminados
            ]
        ];
    }

    public function getActionGetRecaudosApoderado(Request $request): array
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
            
            // Buscar recaudos guardados de tipo apoderado
            $recaudosGuardados = $entityManager->getRepository('InvPropiedadesRecaudos')
                ->join('idRecaudos')
                ->where([
                    'idInvPropiedadesId' => $inventario->get('id'),
                    'idRecaudos.tipo' => 'Apoderado',
                    'deleted' => false
                ])
                ->find();
            
            $recaudos = [];
            
            foreach ($recaudosGuardados as $rel) {
                $recaudo = $rel->get('idRecaudos');
                if ($recaudo) {
                    $recaudos[] = [
                        'id' => $recaudo->get('id'),
                        'name' => $recaudo->get('name'),
                        'estado' => $rel->get('estado') ?? 'Modificar/No Tiene'
                    ];
                }
            }
            
            return [
                'success' => true,
                'data' => [
                    'recaudos' => $recaudos
                ]
            ];
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('Error en getRecaudosApoderado: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Guardar recaudos INCREMENTALMENTE - NUEVA VERSIÓN
     */
    private function guardarRecaudosIncremental($inventario, $recaudosArray, $valoresArray): array
    {
        $entityManager = $this->getContainer()->get('entityManager');
        $inventarioId = $inventario->get('id');
        
        // Convertir a arrays
        if (is_object($recaudosArray)) {
            $recaudosArray = json_decode(json_encode($recaudosArray), true);
        }
        if (is_object($valoresArray)) {
            $valoresArray = json_decode(json_encode($valoresArray), true);
        }
        
        if (!is_array($recaudosArray) || count($recaudosArray) === 0) {
            $GLOBALS['log']->info('⚠️ Array vacío, saltando guardado');
            return ['creados' => 0, 'actualizados' => 0, 'eliminados' => 0];
        }
        
        $creados = 0;
        $actualizados = 0;
        $eliminados = 0;
        
        // PASO 1: Extraer IDs de recaudos actuales
        $recaudosIdsActuales = [];
        foreach ($recaudosArray as $recaudo) {
            if (is_object($recaudo)) {
                $recaudo = json_decode(json_encode($recaudo), true);
            }
            if (isset($recaudo['recaudoId'])) {
                $recaudosIdsActuales[] = strval($recaudo['recaudoId']);
            }
        }
        
        if (count($recaudosIdsActuales) === 0) {
            $GLOBALS['log']->info('⚠️ No hay IDs para guardar');
            return ['creados' => 0, 'actualizados' => 0, 'eliminados' => 0];
        }
        
        $GLOBALS['log']->info('📋 IDs a guardar: ' . json_encode($recaudosIdsActuales));
        
        // PASO 2: Determinar el TIPO de recaudos (Legal/Mercadeo/Apoderado)
        // Obtener el tipo del primer recaudo para saber qué grupo es
        $primerRecaudoId = $recaudosIdsActuales[0];
        $primerRecaudo = $entityManager->getEntity('InvRecaudos', $primerRecaudoId);
        
        if (!$primerRecaudo) {
            $GLOBALS['log']->error('❌ No se pudo determinar tipo de recaudo');
            return ['creados' => 0, 'actualizados' => 0, 'eliminados' => 0];
        }
        
        $tipoGrupo = $primerRecaudo->get('tipo');
        $GLOBALS['log']->info('🏷️ Tipo de grupo: ' . $tipoGrupo);
        
        // PASO 3: Obtener SOLO los recaudos de ESTE TIPO en BD
        $pdo = $entityManager->getPDO();
        
        $stmt = $pdo->prepare("
            SELECT pr.id, pr.id_recaudos_id, pr.estado, pr.deleted
            FROM inv_propiedades_recaudos pr
            INNER JOIN inv_recaudos r ON pr.id_recaudos_id = r.id
            WHERE pr.id_inv_propiedades_id = :invId
            AND r.tipo = :tipo
            AND pr.deleted = 0
        ");
        
        $stmt->execute([
            'invId' => $inventarioId,
            'tipo' => $tipoGrupo
        ]);
        
        $recaudosExistentes = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $idsExistentesEnBD = [];
        foreach ($recaudosExistentes as $rel) {
            $idsExistentesEnBD[] = strval($rel['id_recaudos_id']);
        }
        
        $GLOBALS['log']->info('💾 IDs en BD (tipo=' . $tipoGrupo . ', deleted=0): ' . json_encode($idsExistentesEnBD));
        
        // PASO 4: Marcar como eliminados los de ESTE TIPO que ya NO están
        foreach ($recaudosExistentes as $rel) {
            $recaudoIdEnBD = strval($rel['id_recaudos_id']);
            
            if (!in_array($recaudoIdEnBD, $recaudosIdsActuales, true)) {
                // Este recaudo ya no está → eliminarlo
                $relacion = $entityManager->getEntity('InvPropiedadesRecaudos', $rel['id']);
                if ($relacion) {
                    $relacion->set('deleted', true);
                    $entityManager->saveEntity($relacion);
                    $eliminados++;
                    $GLOBALS['log']->info('🗑️ Eliminado: ' . $recaudoIdEnBD . ' (tipo: ' . $tipoGrupo . ')');
                }
            }
        }
        
        // PASO 5: Crear o actualizar los recaudos actuales
        foreach ($recaudosArray as $recaudoData) {
            if (is_object($recaudoData)) {
                $recaudoData = json_decode(json_encode($recaudoData), true);
            }
            
            if (!is_array($recaudoData)) continue;
            
            $recaudoId = $recaudoData['recaudoId'] ?? null;
            if (!$recaudoId) continue;
            
            $recaudoIdStr = strval($recaudoId);
            
            $estado = isset($valoresArray[$recaudoIdStr]) ? 
                    $valoresArray[$recaudoIdStr] : 
                    ($recaudoData['estado'] ?? 'Modificar/No Tiene');
            
            // Buscar si ya existe
            $relacion = $entityManager->getRepository('InvPropiedadesRecaudos')
                ->where([
                    'idInvPropiedadesId' => $inventarioId,
                    'idRecaudosId' => $recaudoIdStr
                ])
                ->findOne();
            
            if ($relacion) {
                // ACTUALIZAR
                $estadoAnterior = $relacion->get('estado');
                $wasDeleted = $relacion->get('deleted');
                
                if ($estadoAnterior !== $estado || $wasDeleted) {
                    $relacion->set('estado', $estado);
                    $relacion->set('deleted', false);
                    $entityManager->saveEntity($relacion);
                    $actualizados++;
                    
                    if ($wasDeleted) {
                        $GLOBALS['log']->info('♻️ Reactivado: ' . $recaudoIdStr . ' → ' . $estado);
                    } else {
                        $GLOBALS['log']->info('🔄 Actualizado: ' . $recaudoIdStr . ' (' . $estadoAnterior . ' → ' . $estado . ')');
                    }
                } else {
                    $GLOBALS['log']->info('✓ Sin cambios: ' . $recaudoIdStr);
                }
            } else {
                // CREAR
                $relacion = $entityManager->getEntity('InvPropiedadesRecaudos');
                $relacion->set([
                    'idInvPropiedadesId' => $inventarioId,
                    'idRecaudosId' => $recaudoIdStr,
                    'estado' => $estado,
                    'deleted' => false
                ]);
                $entityManager->saveEntity($relacion);
                $creados++;
                $GLOBALS['log']->info('➕ Creado: ' . $recaudoIdStr . ' (' . $estado . ', tipo: ' . $tipoGrupo . ')');
            }
        }
        
        return [
            'creados' => $creados,
            'actualizados' => $actualizados,
            'eliminados' => $eliminados
        ];
    }

    
    /**
     * Calcular nota según porcentajes
     */
    private function calcularNota($data, $tipo): string
    {
        $recaudos = [];
        $valores = [];
        
        if ($tipo === 'legal') {
            $recaudos = $data['recaudosLegal'] ?? [];
            $valores = $data['valoresRecaudosLegal'] ?? [];
        } else if ($tipo === 'mercadeo') {
            $recaudos = $data['recaudosMercadeo'] ?? [];
            $valores = $data['valoresRecaudosMercadeo'] ?? [];
        }
        
        if (is_object($recaudos)) {
            $recaudos = json_decode(json_encode($recaudos), true);
        }
        if (is_object($valores)) {
            $valores = json_decode(json_encode($valores), true);
        }
        
        if (!is_array($recaudos) || count($recaudos) === 0) {
            return 'Modificar';
        }
        
        $totalRecaudos = count($recaudos);
        $completosRecaudos = 0;
        
        foreach ($recaudos as $recaudo) {
            if (is_object($recaudo)) {
                $recaudo = json_decode(json_encode($recaudo), true);
            }
            
            $recaudoId = $recaudo['recaudoId'] ?? null;
            if (!$recaudoId) continue;
            
            $estado = $valores[$recaudoId] ?? ($recaudo['estado'] ?? 'Modificar/No Tiene');
            
            if ($estado === 'Adecuado') {
                $completosRecaudos++;
            }
        }
        
        $porcentaje = ($totalRecaudos > 0) ? round(($completosRecaudos / $totalRecaudos) * 100) : 0;
        
        if ($tipo === 'legal') {
            if ($porcentaje >= 90) return 'Adecuado';
            if ($porcentaje >= 80) return 'Revisar';
            return 'Modificar';
        } else if ($tipo === 'mercadeo') {
            if ($porcentaje >= 90) return 'Adecuado';
            if ($porcentaje >= 70) return 'Revisar';
            return 'Modificar';
        }
        
        return 'Modificar';
    }
    
    /**
     * Mapear valores de "Otros" a notas
     */
    private function mapearNotaOtros($valor): string
    {
        $verdes = [
            'Exclusividad pura o total con contrato firmado',
            'En rango',
            'Ubicación atractiva',
            'Alta demanda'
        ];
        
        $amarillos = [
            'Exclusividad interna de CENTURY con contrato firmado',
            'Cercano al rango de precio',
            'Ubicación medianamente atractiva',
            'Media demanda'
        ];
        
        if (in_array($valor, $verdes)) return 'Adecuado';
        if (in_array($valor, $amarillos)) return 'Revisar';
        return 'Modificar';
    }
    
    /**
     * Guardar sub buyers
     */
    private function guardarSubBuyers($inventario, $subBuyersIds)
    {
        $entityManager = $this->getContainer()->get('entityManager');
        $repository = $entityManager->getRepository('InvPropiedades');
        
        try {
            $actuales = $repository->getRelation($inventario, 'subBuyers')->find();
            $actualesIds = [];
            foreach ($actuales as $sb) {
                $actualesIds[] = $sb->get('id');
            }
            
            foreach ($actualesIds as $actualId) {
                if (!in_array($actualId, $subBuyersIds)) {
                    $repository->unrelate($inventario, 'subBuyers', $actualId);
                }
            }
            
            foreach ($subBuyersIds as $newId) {
                if (!in_array($newId, $actualesIds)) {
                    $repository->relate($inventario, 'subBuyers', $newId);
                }
            }
        } catch (\Exception $e) {
            $pdo = $entityManager->getPDO();
            
            $stmt = $pdo->prepare("
                UPDATE inv_propiedades_inv_sub_buyer 
                SET deleted = 1 
                WHERE inv_propiedades_id = :invId
            ");
            $stmt->execute(['invId' => $inventario->get('id')]);
            
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
}