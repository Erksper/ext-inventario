<?php

namespace Espo\Modules\Inventario\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;

class InvPropiedades extends Record
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
        
        // Verificar que la propiedad existe
        $propiedad = $entityManager->getEntity('Propiedades', $propiedadId);
        
        if (!$propiedad) {
            return [
                'success' => false,
                'error' => 'Propiedad no encontrada'
            ];
        }
        
        // Buscar si ya existe un inventario para esta propiedad
        $inventario = $entityManager->getRepository('InvPropiedades')
            ->where([
                'idPropiedadId' => $propiedadId,
                'deleted' => false
            ])
            ->findOne();
        
        // Si no existe, crear uno nuevo con valores por defecto
        if (!$inventario) {
            try {
                $inventario = $entityManager->getEntity('InvPropiedades');
                
                $inventario->set([
                    'idPropiedadId' => $propiedadId,
                    'name' => 'Inventario - ' . $propiedad->get('name'),
                    'tipoDePropiedad' => $propiedad->get('tipoPropiedad'),
                    'tipoPersona' => 'Natural',
                    'buyer' => 'Comprador',
                    'buyerPersona' => 'Comprador',
                    'subBuyer' => '',
                    'subBuyerPersona' => '',
                    'fotos' => 'Modificar',
                    'copy' => 'Modificar',
                    'video' => 'Modificar',
                    'videoInsertado' => 'Modificar',
                    'metricas' => 'Modificar',
                    'rotulo' => 'Modificar',
                    'precio' => 'En rango',
                    'ubicacion' => 'Modificar',
                    'exclusividad' => 'No exclusividad',
                    'apoderado' => false,
                    'demanda' => 'Media demanda',
                    'notaLegal' => 'Modificar',
                    'notaMercadeo' => 'Modificar',
                    'notaPrecio' => 'Modificar',
                    'notaExclusiva' => 'Modificar',
                    'notaUbicacion' => 'Modificar'
                ]);
                
                $entityManager->saveEntity($inventario);
                
            } catch (\Exception $e) {
                return [
                    'success' => false,
                    'error' => 'Error al crear inventario: ' . $e->getMessage()
                ];
            }
        }
        
        // Obtener datos de la propiedad
        $asesorNombre = null;
        $assignedUser = $propiedad->get('assignedUser');
        if ($assignedUser) {
            $asesorNombre = $assignedUser->get('name');
        }
        
        // Formatear ubicación para evitar problemas de encoding
        $ubicacionCompleta = [];
        $camposUbicacion = ['calle', 'numero', 'urbanizacion', 'municipio', 'ciudad', 'estado'];

        foreach ($camposUbicacion as $campo) {
            $valor = $propiedad->get($campo);
            if (!empty($valor)) {
                // Decodificar cualquier entidad HTML y asegurar UTF-8
                $valor = html_entity_decode($valor, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                // Limpiar y asegurar encoding
                $valor = trim($valor);
                if (!empty($valor)) {
                    $ubicacionCompleta[] = $valor;
                }
            }
        }

        $ubicacionStr = implode(', ', $ubicacionCompleta);
        // Si después de todo sigue vacío, poner un guión
        if (empty($ubicacionStr)) {
            $ubicacionStr = '-';
        }
        
        return [
            'success' => true,
            'data' => [
                'inventario' => [
                    'id' => $inventario->get('id'),
                    'tipoPersona' => $inventario->get('tipoPersona'),
                    'buyer' => $inventario->get('buyer'),
                    'buyerPersona' => $inventario->get('buyerPersona') ?: $inventario->get('buyer'),
                    'subBuyer' => $inventario->get('subBuyer'),
                    'subBuyerPersona' => $inventario->get('subBuyerPersona') ?: $inventario->get('subBuyer'),
                    'fotos' => $inventario->get('fotos'),
                    'copy' => $inventario->get('copy'),
                    'video' => $inventario->get('video'),
                    'videoInsertado' => $inventario->get('videoInsertado'),
                    'metricas' => $inventario->get('metricas'),
                    'rotulo' => $inventario->get('rotulo'),
                    'precio' => $inventario->get('precio'),
                    'ubicacion' => $inventario->get('ubicacion'),
                    'exclusividad' => $inventario->get('exclusividad'),
                    'apoderado' => $inventario->get('apoderado'),
                    'demanda' => $inventario->get('demanda'),
                    'notaLegal' => $inventario->get('notaLegal'),
                    'notaMercadeo' => $inventario->get('notaMercadeo'),
                    'notaPrecio' => $inventario->get('notaPrecio'),
                    'notaExclusiva' => $inventario->get('notaExclusiva'),
                    'notaUbicacion' => $inventario->get('notaUbicacion')
                ],
                'propiedad' => [
                    'id' => $propiedad->get('id'),
                    'name' => $propiedad->get('name'),
                    'tipoOperacion' => $propiedad->get('tipoOperacion'),
                    'tipoPropiedad' => $propiedad->get('tipoPropiedad'),
                    'subTipoPropiedad' => $propiedad->get('subTipoPropiedad'),
                    'm2C' => $propiedad->get('m2C'),
                    'm2T' => $propiedad->get('m2T'),
                    'ubicacion' => $ubicacionStr,
                    'asesorNombre' => $asesorNombre,
                    'fechaAlta' => $propiedad->get('fechaAlta'),
                    'status' => $propiedad->get('status')
                ]
            ]
        ];
    }
    
    /**
     * Guardar inventario
     */
    public function postActionSave(Request $request): array
    {
        $data = $request->getParsedBody();
        
        if (is_object($data)) {
            $data = (array) $data;
        }
        
        if (empty($data['inventarioId'])) {
            return [
                'success' => false,
                'error' => 'inventarioId es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        $inventario = $entityManager->getEntity('InvPropiedades', $data['inventarioId']);
        
        if (!$inventario) {
            return [
                'success' => false,
                'error' => 'Inventario no encontrado'
            ];
        }
        
        try {
            // Actualizar campos
            $updates = [
                'tipoPersona' => $data['tipoPersona'] ?? $inventario->get('tipoPersona'),
                'buyer' => $data['buyerPersona'] ?? $inventario->get('buyer'),
                'buyerPersona' => $data['buyerPersona'] ?? $inventario->get('buyerPersona'),
                'subBuyer' => $data['subBuyerPersona'] ?? $inventario->get('subBuyer'),
                'subBuyerPersona' => $data['subBuyerPersona'] ?? $inventario->get('subBuyerPersona'),
                'demanda' => $data['demanda'] ?? $inventario->get('demanda'),
                'fotos' => $data['fotos'] ?? $inventario->get('fotos'),
                'copy' => $data['copy'] ?? $inventario->get('copy'),
                'video' => $data['video'] ?? $inventario->get('video'),
                'videoInsertado' => $data['videoInsertado'] ?? $inventario->get('videoInsertado'),
                'metricas' => $data['metricas'] ?? $inventario->get('metricas'),
                'rotulo' => $data['rotulo'] ?? $inventario->get('rotulo'),
                'precio' => $data['precio'] ?? $inventario->get('precio'),
                'ubicacion' => $data['ubicacion'] ?? $inventario->get('ubicacion'),
                'exclusividad' => $data['exclusividad'] ?? $inventario->get('exclusividad'),
                'apoderado' => isset($data['apoderado']) ? ($data['apoderado'] === 'true' || $data['apoderado'] === true) : $inventario->get('apoderado'),
                'notaLegal' => $data['notaLegal'] ?? $inventario->get('notaLegal'),
                'notaMercadeo' => $data['notaMercadeo'] ?? $inventario->get('notaMercadeo'),
                'notaPrecio' => $data['notaPrecio'] ?? $inventario->get('notaPrecio'),
                'notaExclusiva' => $data['notaExclusiva'] ?? $inventario->get('notaExclusiva'),
                'notaUbicacion' => $data['notaUbicacion'] ?? $inventario->get('notaUbicacion')
            ];
            
            $inventario->set($updates);
            $entityManager->saveEntity($inventario);
            
            return [
                'success' => true,
                'message' => 'Inventario guardado exitosamente'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al guardar inventario: ' . $e->getMessage()
            ];
        }
    }

    /**
    * Obtener sub buyers por buyer
    */
    public function getActionGetSubBuyers(Request $request): array
    {
        $buyer = $request->getQueryParam('buyer');
        
        if (!$buyer) {
            return [
                'success' => false,
                'error' => 'buyer es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        try {
            // Buscar en InvSubBuyer donde el campo buyer coincida
            $subBuyers = $entityManager->getRepository('InvSubBuyer')
                ->select(['id', 'name'])
                ->where([
                    'buyer' => $buyer,
                    'deleted' => false
                ])
                ->order('name', 'ASC')
                ->find();
            
            $result = [];
            foreach ($subBuyers as $subBuyer) {
                $result[] = [
                    'id' => $subBuyer->get('id'),
                    'name' => $subBuyer->get('name')
                ];
            }
            
            // Si no hay resultados, devolver array vacío
            return [
                'success' => true,
                'data' => $result
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al cargar sub buyers: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtener recaudos por tipo y default
     */
    public function getActionGetRecaudosByTipo(Request $request): array
    {
        $tipo = $request->getQueryParam('tipo');
        $default = $request->getQueryParam('default');
        
        if (!$tipo) {
            return [
                'success' => false,
                'error' => 'tipo es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        try {
            // Construir condiciones
            $conditions = [
                'deleted' => false
            ];
            
            // Si es un array de tipos (para legal)
            if (is_array($tipo)) {
                $conditions['tipo'] = $tipo;
            } else {
                $conditions['tipo'] = $tipo;
            }
            
            // Filtrar por default si se especifica
            if ($default !== null) {
                $conditions['default'] = ($default === 'true' || $default === true);
            }
            
            // Buscar en InvRecaudos
            $query = $entityManager->getRepository('InvRecaudos')
                ->select(['id', 'name', 'descripcion', 'default'])
                ->where($conditions)
                ->order('name', 'ASC');
            
            $recaudos = $query->find();
            
            $result = [];
            foreach ($recaudos as $recaudo) {
                $result[] = [
                    'id' => $recaudo->get('id'),
                    'name' => $recaudo->get('name'),
                    'descripcion' => $recaudo->get('descripcion') ?: '',
                    'default' => $recaudo->get('default')
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
}