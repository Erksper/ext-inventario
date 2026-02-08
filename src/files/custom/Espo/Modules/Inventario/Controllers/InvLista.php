<?php

namespace Espo\Modules\Inventario\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;

class InvLista extends Record
{
    /**
     * Obtener información del usuario actual
     */
    public function getActionGetUserInfo(Request $request): array
    {
        $userId = $request->getQueryParam('userId');
        
        if (!$userId) {
            return [
                'success' => false,
                'error' => 'userId es requerido'
            ];
        }
        
        // Obtener EntityManager a través del contenedor
        $entityManager = $this->getContainer()->get('entityManager');
        $user = $entityManager->getEntity('User', $userId);
        
        if (!$user) {
            return [
                'success' => false,
                'error' => 'Usuario no encontrado'
            ];
        }
        
        // Obtener tipo de usuario
        $userType = $user->get('type');
        
        // Obtener teams del usuario
        $teams = $user->get('teams');
        $teamIds = [];
        if ($teams) {
            foreach ($teams as $team) {
                $teamIds[] = $team->id;
            }
        }
        
        // Determinar roles
        $esCasaNacional = false;
        $esGerente = false;
        $esDirector = false;
        $esCoordinador = false;
        $claUsuario = null;
        $oficinaUsuario = null;
        
        // Obtener el primer team como oficina (esto puede variar según tu lógica)
        if (count($teamIds) > 0) {
            $oficinaUsuario = $teamIds[0];
            
            // Aquí deberías implementar tu lógica para determinar
            // si el team es CLA, si el usuario es gerente, etc.
            // Por ahora, devolvemos valores por defecto
        }
        
        return [
            'success' => true,
            'data' => [
                'usuarioId' => $userId,
                'userType' => $userType,
                'esCasaNacional' => $esCasaNacional,
                'esGerente' => $esGerente,
                'esDirector' => $esDirector,
                'esCoordinador' => $esCoordinador,
                'claUsuario' => $claUsuario,
                'oficinaUsuario' => $oficinaUsuario
            ]
        ];
    }
    
    /**
     * Obtener lista de CLAs
     */
    public function getActionGetCLAs(Request $request): array
    {
        // Obtener EntityManager a través del contenedor
        $entityManager = $this->getContainer()->get('entityManager');
        
        // Aquí deberías implementar tu lógica para obtener CLAs
        // Por ahora retornamos un ejemplo
        $teams = $entityManager->getRepository('Team')
            ->select(['id', 'name'])
            ->find();
        
        $clas = [];
        foreach ($teams as $team) {
            $clas[] = [
                'id' => $team->get('id'),
                'name' => $team->get('name')
            ];
        }
        
        return [
            'success' => true,
            'data' => $clas
        ];
    }
    
    /**
     * Obtener oficinas por CLA
     */
    public function getActionGetOficinasByCLA(Request $request): array
    {
        $claId = $request->getQueryParam('claId');
        
        if (!$claId) {
            return [
                'success' => false,
                'error' => 'claId es requerido'
            ];
        }
        
        // Obtener EntityManager a través del contenedor
        $entityManager = $this->getContainer()->get('entityManager');
        
        // Aquí implementar lógica para obtener oficinas del CLA
        $teams = $entityManager->getRepository('Team')
            ->select(['id', 'name'])
            ->find();
        
        $oficinas = [];
        foreach ($teams as $team) {
            $oficinas[] = [
                'id' => $team->get('id'),
                'name' => $team->get('name')
            ];
        }
        
        return [
            'success' => true,
            'data' => $oficinas
        ];
    }
    
    /**
     * Obtener asesores por oficina
     */
    public function getActionGetAsesoresByOficina(Request $request): array
    {
        $oficinaId = $request->getQueryParam('oficinaId');
        
        if (!$oficinaId) {
            return [
                'success' => false,
                'error' => 'oficinaId es requerido'
            ];
        }
        
        // Obtener EntityManager a través del contenedor
        $entityManager = $this->getContainer()->get('entityManager');
        
        // Obtener usuarios del team
        $team = $entityManager->getEntity('Team', $oficinaId);
        
        if (!$team) {
            return [
                'success' => false,
                'error' => 'Oficina no encontrada'
            ];
        }
        
        // Obtener usuarios del team
        $users = $entityManager->getRepository('User')
            ->select(['id', 'name'])
            ->where([
                'isActive' => true,
                'type' => 'regular'
            ])
            ->find();
        
        $asesores = [];
        foreach ($users as $user) {
            $asesores[] = [
                'id' => $user->get('id'),
                'name' => $user->get('name')
            ];
        }
        
        return [
            'success' => true,
            'data' => $asesores
        ];
    }
    
    /**
     * Obtener información de oficina
     */
    public function getActionGetInfoOficina(Request $request): array
    {
        $oficinaId = $request->getQueryParam('oficinaId');
        
        if (!$oficinaId) {
            return [
                'success' => false,
                'error' => 'oficinaId es requerido'
            ];
        }
        
        // Obtener EntityManager a través del contenedor
        $entityManager = $this->getContainer()->get('entityManager');
        $team = $entityManager->getEntity('Team', $oficinaId);
        
        if (!$team) {
            return [
                'success' => false,
                'error' => 'Oficina no encontrada'
            ];
        }
        
        return [
            'success' => true,
            'data' => [
                'nombreOficina' => $team->get('name')
            ]
        ];
    }
    
    /**
     * Obtener propiedades con filtros
     */
    public function getActionGetPropiedades(Request $request): array
    {
        // Obtener EntityManager a través del contenedor
        $entityManager = $this->getContainer()->get('entityManager');
        
        // Obtener parámetros de filtro
        $claId = $request->getQueryParam('claId');
        $oficinaId = $request->getQueryParam('oficinaId');
        $asesorId = $request->getQueryParam('asesorId');
        $estado = $request->getQueryParam('estado');
        $municipio = $request->getQueryParam('municipio');
        $ciudad = $request->getQueryParam('ciudad');
        $fechaDesde = $request->getQueryParam('fechaDesde');
        $fechaHasta = $request->getQueryParam('fechaHasta');
        
        // Construir query
        $query = $entityManager->getRepository('Propiedades')
            ->select([
                'id',
                'name',
                'fechaAlta',
                'calle',
                'numero',
                'urbanizacion',
                'municipio',
                'ciudad',
                'tipoPropiedad',
                'tipoOperacion',
                'status'
            ]);
        
        $whereClause = [];
        
        if ($estado) {
            $whereClause['status'] = $estado;
        }
        
        if ($municipio) {
            $whereClause['municipio*'] = '%' . $municipio . '%';
        }
        
        if ($ciudad) {
            $whereClause['ciudad*'] = '%' . $ciudad . '%';
        }
        
        if ($fechaDesde) {
            $whereClause['fechaAlta>='] = $fechaDesde;
        }
        
        if ($fechaHasta) {
            $whereClause['fechaAlta<='] = $fechaHasta;
        }
        
        if ($asesorId) {
            $whereClause['assignedUserId'] = $asesorId;
        }
        
        $query->where($whereClause);
        $query->order('fechaAlta', 'DESC');
        
        $propiedades = $query->find();
        
        $result = [];
        foreach ($propiedades as $propiedad) {
            // Obtener nombre del asesor si existe
            $asesorNombre = null;
            $assignedUser = $propiedad->get('assignedUser');
            if ($assignedUser) {
                $asesorNombre = $assignedUser->get('name');
            }
            
            $result[] = [
                'id' => $propiedad->get('id'),
                'name' => $propiedad->get('name'),
                'fechaAlta' => $propiedad->get('fechaAlta'),
                'calle' => $propiedad->get('calle'),
                'numero' => $propiedad->get('numero'),
                'urbanizacion' => $propiedad->get('urbanizacion'),
                'municipio' => $propiedad->get('municipio'),
                'ciudad' => $propiedad->get('ciudad'),
                'tipoPropiedad' => $propiedad->get('tipoPropiedad'),
                'tipoOperacion' => $propiedad->get('tipoOperacion'),
                'status' => $propiedad->get('status'),
                'asesorNombre' => $asesorNombre
            ];
        }
        
        return [
            'success' => true,
            'data' => $result
        ];
    }

    // Agrega este método en InvLista.php, dentro de la clase InvLista

    /**
     * Obtener datos de inventario para propiedades
     */
    public function postActionGetInventarioData(Request $request): array
    {
        $data = $request->getParsedBody();

        if (is_object($data)) {
            $data = (array) $data;
        }
        $propiedadIds = $data['propiedadIds'] ?? [];
        
        if (empty($propiedadIds)) {
            return [
                'success' => true,
                'data' => []
            ];
        }
        

        $entityManager = $this->getContainer()->get('entityManager');
        
        $result = [];
        
        foreach ($propiedadIds as $propiedadId) {
            // Buscar InvPropiedades relacionado
            $inventario = $entityManager->getRepository('InvPropiedades')
                ->where([
                    'idPropiedadId' => $propiedadId,
                    'deleted' => false
                ])
                ->findOne();
            
            if ($inventario) {
                $result[$propiedadId] = [
                    'notaLegal' => $inventario->get('notaLegal'),
                    'notaMercadeo' => $inventario->get('notaMercadeo'),
                    'notaPrecio' => $inventario->get('notaPrecio'),
                    'notaExclusiva' => $inventario->get('notaExclusiva'),
                    'notaUbicacion' => $inventario->get('notaUbicacion')
                ];
            }
        }
        
        return [
            'success' => true,
            'data' => $result
        ];
    }

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

    /**
     * Obtener datos de inventario por ID
     */
    public function getActionGetInventarioDataById(Request $request): array
    {
        $inventarioId = $request->getQueryParam('inventarioId');
        
        if (!$inventarioId) {
            return [
                'success' => false,
                'error' => 'inventarioId es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        $inventario = $entityManager->getEntity('InvPropiedades', $inventarioId);
        
        if (!$inventario) {
            return [
                'success' => false,
                'error' => 'Inventario no encontrado'
            ];
        }
        
        return [
            'success' => true,
            'data' => [
                'tipoPersona' => $inventario->get('tipoPersona'),
                'demanda' => $inventario->get('demanda'),
                'tipoAcabado' => $inventario->get('tipoAcabado'),
                'apoderado' => $inventario->get('apoderado'),
                'buyer' => $inventario->get('buyer'),
                'subBuyer' => $inventario->get('subBuyer'),
                'fotos' => $inventario->get('fotos'),
                'copy' => $inventario->get('copy'),
                'video' => $inventario->get('video'),
                'videoInsertado' => $inventario->get('videoInsertado'),
                'metricas' => $inventario->get('metricas'),
                'rotulo' => $inventario->get('rotulo'),
                'precio' => $inventario->get('precio'),
                'ubicacion' => $inventario->get('ubicacion'),
                'exclusividad' => $inventario->get('exclusividad'),
                'notaLegal' => $inventario->get('notaLegal'),
                'notaMercadeo' => $inventario->get('notaMercadeo'),
                'notaPrecio' => $inventario->get('notaPrecio'),
                'notaExclusiva' => $inventario->get('notaExclusiva'),
                'notaUbicacion' => $inventario->get('notaUbicacion')
            ]
        ];
    }

    /**
     * Crear inventario
     */
    public function postActionCreateInventario(Request $request): array
    {
        $data = $request->getParsedBody();
        
        if (is_object($data)) {
            $data = (array) $data;
        }
        
        if (empty($data['propiedadId'])) {
            return [
                'success' => false,
                'error' => 'propiedadId es requerido'
            ];
        }
        
        $entityManager = $this->getContainer()->get('entityManager');
        
        try {
            $inventario = $entityManager->getEntity('InvPropiedades');
            
            // Establecer datos básicos
            $inventario->set([
                'idPropiedadId' => $data['propiedadId'],
                'name' => 'Inventario - ' . date('Y-m-d H:i:s'),
                'buyer' => $data['buyer'] ?? null,
                'subBuyer' => $data['subBuyer'] ?? null,
                'fotos' => $data['fotos'] ?? 'Modificar',
                'copy' => $data['copy'] ?? 'Modificar',
                'video' => $data['video'] ?? 'Modificar',
                'videoInsertado' => $data['videoInsertado'] ?? 'Modificar',
                'metricas' => $data['metricas'] ?? 'Modificar',
                'rotulo' => $data['rotulo'] ?? 'Modificar',
                'precio' => $data['precio'] ?? null,
                'notaLegal' => 'Modificar',
                'notaMercadeo' => $data['notaMercadeo'] ?? 'Modificar',
                'notaPrecio' => $data['notaPrecio'] ?? 'Modificar',
                'notaExclusiva' => $data['notaExclusiva'] ?? 'Modificar',
                'notaUbicacion' => $data['notaUbicacion'] ?? 'Modificar',
                'ubicacion' => $data['ubicacion'] ?? 'Modificar',
                'exclusividad' => $data['exclusividad'] ?? null,
                'apoderado' => isset($data['apoderado']) && $data['apoderado'] === 'si',
                'demanda' => $data['demanda'] ?? null
            ]);
            
            $entityManager->saveEntity($inventario);
            
            return [
                'success' => true,
                'data' => [
                    'id' => $inventario->get('id'),
                    'message' => 'Inventario creado exitosamente'
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al crear inventario: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Actualizar inventario
     */
    public function postActionUpdateInventario(Request $request): array
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
            // Actualizar datos
            $updates = [
                'buyer' => $data['buyer'] ?? null,
                'subBuyer' => $data['subBuyer'] ?? null,
                'fotos' => $data['fotos'] ?? $inventario->get('fotos'),
                'copy' => $data['copy'] ?? $inventario->get('copy'),
                'video' => $data['video'] ?? $inventario->get('video'),
                'videoInsertado' => $data['videoInsertado'] ?? $inventario->get('videoInsertado'),
                'metricas' => $data['metricas'] ?? $inventario->get('metricas'),
                'rotulo' => $data['rotulo'] ?? $inventario->get('rotulo'),
                'precio' => $data['precio'] ?? null,
                'ubicacion' => $data['ubicacion'] ?? $inventario->get('ubicacion'),
                'exclusividad' => $data['exclusividad'] ?? null,
                'apoderado' => isset($data['apoderado']) && $data['apoderado'] === 'si',
                'demanda' => $data['demanda'] ?? null
            ];
            
            $inventario->set($updates);
            $entityManager->saveEntity($inventario);
            
            return [
                'success' => true,
                'data' => [
                    'message' => 'Inventario actualizado exitosamente'
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al actualizar inventario: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Acción para mostrar la página de inventario de propiedad
     */
    public function actionInventarioPropiedad(Request $request): array
    {
        // Esta acción solo debe devolver que existe, la vista se maneja en el frontend
        return [
            'success' => true,
            'data' => [
                'message' => 'Redirigiendo a inventario'
            ]
        ];
    }

}