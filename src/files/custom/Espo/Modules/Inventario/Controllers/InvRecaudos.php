<?php

namespace Espo\Modules\Inventario\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;

class InvRecaudos extends Record
{
    /**
     * Crear nuevo recaudo
     */
    public function postActionCrearRecaudo(Request $request): array
    {
        $data = $request->getParsedBody();
        
        if (is_object($data)) {
            $data = (array) $data;
        }
        
        if (empty($data['nombre'])) {
            return [
                'success' => false,
                'error' => 'El nombre del recaudo es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        try {
            $recaudo = $entityManager->getEntity('InvRecaudos');
            
            // Determinar el tipo
            $tipo = $data['tipo'];
            
            // Si es array (para legal), verificar qué tipo de persona está seleccionada
            if (is_array($tipo)) {
                $tipo = isset($data['tipoPersona']) ? $data['tipoPersona'] : 'Natural';
            }
            
            $recaudo->set([
                'name' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? '',
                'tipo' => $tipo,
                'default' => $data['default'] ?? false
            ]);
            
            // Asignar al usuario actual
            $user = $this->getUser();
            if ($user) {
                $recaudo->set('assignedUserId', $user->getId());
            }
            
            $entityManager->saveEntity($recaudo);
            
            return [
                'success' => true,
                'data' => [
                    'id' => $recaudo->get('id'),
                    'name' => $recaudo->get('name'),
                    'tipo' => $tipo,
                    'message' => 'Recaudo creado exitosamente'
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al crear recaudo: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtener recaudo por ID
     */
    public function getActionGetRecaudoById(Request $request): array
    {
        $recaudoId = $request->getQueryParam('id');
        
        if (!$recaudoId) {
            return [
                'success' => false,
                'error' => 'ID de recaudo es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        $recaudo = $entityManager->getEntity('InvRecaudos', $recaudoId);
        
        if (!$recaudo) {
            return [
                'success' => false,
                'error' => 'Recaudo no encontrado'
            ];
        }
        
        return [
            'success' => true,
            'data' => [
                'id' => $recaudo->get('id'),
                'name' => $recaudo->get('name'),
                'descripcion' => $recaudo->get('descripcion'),
                'tipo' => $recaudo->get('tipo'),
                'default' => $recaudo->get('default')
            ]
        ];
    }

    /**
     * Obtener recaudos por tipo y default
     */
    public function getActionGetRecaudosByTipo(Request $request): array
    {
        $tipoParam = $request->getQueryParam('tipo');
        $default = $request->getQueryParam('default');
        
        // Decodificar si es JSON (para tipos array)
        if (is_string($tipoParam) && strpos($tipoParam, '[') !== false) {
            $tipoParam = json_decode($tipoParam, true);
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        try {
            // Construir condiciones
            $conditions = [
                'deleted' => false
            ];
            
            // Manejar diferentes formatos de tipo
            if (is_array($tipoParam)) {
                $conditions['tipo'] = $tipoParam;
            } else {
                $conditions['tipo'] = $tipoParam;
            }
            
            // Filtrar por default si se especifica
            if ($default !== null) {
                $conditions['default'] = ($default === 'true' || $default === true);
            }
            
            // Buscar en InvRecaudos
            $query = $entityManager->getRepository('InvRecaudos')
                ->select(['id', 'name', 'descripcion', 'default', 'tipo'])
                ->where($conditions)
                ->order('name', 'ASC');
            
            $recaudos = $query->find();
            
            $result = [];
            foreach ($recaudos as $recaudo) {
                $result[] = [
                    'id' => $recaudo->get('id'),
                    'name' => $recaudo->get('name'),
                    'descripcion' => $recaudo->get('descripcion') ?: '',
                    'default' => $recaudo->get('default'),
                    'tipo' => $recaudo->get('tipo')
                ];
            }
            
            return [
                'success' => true,
                'data' => $result
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al cargar recaudos: ' . $e->getMessage()
            ];
        }
    }

    public function getActionGetRecaudosRelacionados(Request $request): array
    {
        $propiedadId = $request->getQueryParam('propiedadId');
        $tipo = $request->getQueryParam('tipo'); // 'legal', 'mercadeo', 'apoderado'
        
        if (!$propiedadId || !$tipo) {
            return [
                'success' => false,
                'error' => 'propiedadId y tipo son requeridos'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        try {
            // Mapear tipo de frontend a tipos de backend
            $tiposBackend = [
                'legal' => ['Natural', 'Juridico'],
                'mercadeo' => 'Mercadeo',
                'apoderado' => 'Apoderado'
            ];
            
            $tipoBackend = $tiposBackend[$tipo] ?? $tipo;
            
            // Buscar el inventario de la propiedad
            $inventario = $entityManager->getRepository('InvPropiedades')
                ->where([
                    'idPropiedadId' => $propiedadId,
                    'deleted' => false
                ])
                ->findOne();
            
            if (!$inventario) {
                return [
                    'success' => true,
                    'data' => [
                        'recaudos' => [],
                        'esPorDefecto' => true
                    ]
                ];
            }
            
            // Buscar recaudos relacionados
            $recaudosRelacionados = [];
            $esPorDefecto = false;
            
            $propiedadesRecaudos = $entityManager->getRepository('InvPropiedadesRecaudos')
                ->distinct()
                ->join('idRecaudos')
                ->where([
                    'idInvPropiedadesId' => $inventario->get('id'),
                    'deleted' => false
                ])
                ->find();
            
            // Filtrar por tipo
            foreach ($propiedadesRecaudos as $propRecaudo) {
                // ═══════════════════════════════════════════════════════════
                // CORRECCIÓN: Obtener recaudo usando getRelation()
                // ═══════════════════════════════════════════════════════════
                $recaudo = $entityManager->getRelation($propRecaudo, 'idRecaudos')->findOne();
                if ($recaudo) {
                    $tipoRecaudo = $recaudo->get('tipo');
                    
                    // Verificar si coincide con el tipo solicitado
                    $coincide = false;
                    if (is_array($tipoBackend)) {
                        $coincide = in_array($tipoRecaudo, $tipoBackend);
                    } else {
                        $coincide = ($tipoRecaudo === $tipoBackend);
                    }
                    
                    if ($coincide) {
                        $recaudosRelacionados[] = [
                            'id' => $recaudo->get('id'),
                            'name' => $recaudo->get('name'),
                            'descripcion' => $recaudo->get('descripcion'),
                            'default' => $recaudo->get('default'),
                            'tipo' => $tipoRecaudo,
                            'idRelacion' => $propRecaudo->get('id')
                        ];
                    }
                }
            }
            
            // Si no hay recaudos relacionados, cargar los por defecto
            if (empty($recaudosRelacionados)) {
                $esPorDefecto = true;
                
                $condiciones = ['deleted' => false, 'default' => true];
                if (is_array($tipoBackend)) {
                    $condiciones['tipo'] = $tipoBackend;
                } else {
                    $condiciones['tipo'] = $tipoBackend;
                }
                
                $recaudosDefault = $entityManager->getRepository('InvRecaudos')
                    ->where($condiciones)
                    ->find();
                
                foreach ($recaudosDefault as $recaudo) {
                    $recaudosRelacionados[] = [
                        'id' => $recaudo->get('id'),
                        'name' => $recaudo->get('name'),
                        'descripcion' => $recaudo->get('descripcion'),
                        'default' => true,
                        'tipo' => $recaudo->get('tipo'),
                        'idRelacion' => null
                    ];
                }
            }
            
            return [
                'success' => true,
                'data' => [
                    'recaudos' => $recaudosRelacionados,
                    'esPorDefecto' => $esPorDefecto
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al cargar recaudos: ' . $e->getMessage()
            ];
        }
    }
}