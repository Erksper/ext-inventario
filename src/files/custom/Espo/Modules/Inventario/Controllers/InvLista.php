<?php

namespace Espo\Modules\Inventario\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;

class InvLista extends Record
{
    // ═══════════════════════════════════════════════════════════
    // USER INFO - CON JERARQUÍA CORREGIDA
    // ═══════════════════════════════════════════════════════════

    public function getActionGetUserInfo(Request $request): array
    {
        $userId = $request->getQueryParam('userId');
        if (!$userId) {
            return ['success' => false, 'error' => 'userId es requerido'];
        }

        $em   = $this->getContainer()->get('entityManager');
        $user = $em->getEntityById('User', $userId);
        if (!$user) {
            return ['success' => false, 'error' => 'Usuario no encontrado'];
        }

        $teamIds = []; 
        $claUsuario = null; 
        $claNombre = null;
        $oficinaUsuario = null;
        $oficinaNombre = null;
        
        // Obtener teams del usuario
        $teams = $em->getRelation($user, 'teams')->find();
        if ($teams) {
            foreach ($teams as $team) {
                $id = $team->getId();
                $name = $team->get('name');
                $teamIds[] = $id;
                
                if (strpos($id, 'CLA') === 0) {
                    $claUsuario = $id;
                    $claNombre = $name;
                } else {
                    // Es oficina (no empieza con CLA)
                    if (!$oficinaUsuario) { // Tomar la primera oficina
                        $oficinaUsuario = $id;
                        $oficinaNombre = $name;
                    }
                }
            }
        }
        
        // Si no encontramos oficina en teams, probar con defaultTeam
        if (!$oficinaUsuario) {
            $dtId = $user->get('defaultTeamId');
            if ($dtId && strpos($dtId, 'CLA') !== 0) {
                $oficinaUsuario = $dtId;
                $teamDefault = $em->getEntityById('Team', $dtId);
                $oficinaNombre = $teamDefault ? $teamDefault->get('name') : null;
            }
        }

        // Detectar roles con jerarquía
        $esCasaNacional = false;
        $esGerente = false;
        $esDirector = false;
        $esCoordinador = false;
        
        $roles = $em->getRelation($user, 'roles')->find();
        if ($roles) {
            foreach ($roles as $role) {
                $n = strtolower($role->get('name') ?? '');
                if (str_contains($n, 'casa nacional') || str_contains($n, 'casanacional')) {
                    $esCasaNacional = true;
                }
                if (!$esCasaNacional) {
                    if (str_contains($n, 'gerente')) $esGerente = true;
                    if (str_contains($n, 'director')) $esDirector = true;
                    if (str_contains($n, 'coordinador')) $esCoordinador = true;
                }
            }
        }

        $esAdminType = $user->get('type') === 'admin';
        $tienePoderCasaNacional = $esAdminType || $esCasaNacional;
        $tieneRolesGestion = !$tienePoderCasaNacional && ($esGerente || $esDirector || $esCoordinador);
        $esAsesorPuro = $user->get('type') === 'regular' && !$tieneRolesGestion && !$tienePoderCasaNacional;

        // Log para debug
        $GLOBALS['log']->info("InvLista::getUserInfo - Usuario: {$userId}, Nombre: " . $user->get('name') . ", CLA: {$claNombre} ({$claUsuario}), Oficina: {$oficinaNombre} ({$oficinaUsuario})");

        return ['success' => true, 'data' => [
            'usuarioId'       => $userId,
            'userType'        => $user->get('type'),
            'userName'        => $user->get('name'),
            'esCasaNacional'  => $tienePoderCasaNacional,
            'esGerente'       => $esGerente,
            'esDirector'      => $esDirector,
            'esCoordinador'   => $esCoordinador,
            'tieneRolesGestion' => $tieneRolesGestion,
            'esAsesor'        => $esAsesorPuro,
            'claUsuario'      => $claUsuario,
            'claNombre'       => $claNombre,
            'oficinaUsuario'  => $oficinaUsuario,
            'oficinaNombre'   => $oficinaNombre,
            'teamIds'         => $teamIds,
        ]];
    }

    // ═══════════════════════════════════════════════════════════
    // PROPIEDADES - CON FILTROS POR ROL Y EXCLUSIÓN OFICINA VENEZUELA
    // ═══════════════════════════════════════════════════════════

    public function getActionGetPropiedades(Request $request): array
    {
        $log = $GLOBALS['log'];

        $claId      = $request->getQueryParam('claId');
        $oficinaId  = $request->getQueryParam('oficinaId');
        $asesorId   = $request->getQueryParam('asesorId');
        $fechaDesde = $request->getQueryParam('fechaDesde');
        $fechaHasta = $request->getQueryParam('fechaHasta');
        $estatus    = $request->getQueryParam('estatus');
        $userId     = $request->getQueryParam('userId'); // Para filtrar por asesor actual
        $pagina     = max(1, (int)($request->getQueryParam('pagina') ?? 1));
        $porPagina  = 25;
        $offset     = ($pagina - 1) * $porPagina;

        $log->info("[InvLista::getPropiedades] START pagina={$pagina} claId={$claId} oficinaId={$oficinaId} asesorId={$asesorId} estatus={$estatus}");

        $em  = $this->getContainer()->get('entityManager');
        $pdo = $em->getPDO();

        try {
            // ── Obtener información del usuario actual ─────────────────
            $userInfo = null;
            if ($userId) {
                $userInfo = $this->getUserInfoData($userId);
            }

            // ── 1. Diagnosticar valores de status en la DB ─────────────────
            $statusRows = $pdo->query(
                "SELECT DISTINCT status, COUNT(*) as c FROM propiedades WHERE deleted=0 GROUP BY status ORDER BY c DESC LIMIT 20"
            )->fetchAll(\PDO::FETCH_ASSOC);
            $statusLog = implode(' | ', array_map(fn($r) => "'{$r['status']}':{$r['c']}", $statusRows));
            $log->info("[InvLista::getPropiedades] Status en DB: {$statusLog}");

            // ── 2. Detectar valor exacto de "en promocion" ─────────────────
            $statusTarget = $this->detectarStatusPromocion($pdo, $log);
            $log->info("[InvLista::getPropiedades] Status target: '{$statusTarget}'");

            // ── 3. Construir WHERE SQL para IDs ────────────────────────────
            $where  = "p.deleted = 0";
            $params = [];

            if ($statusTarget !== null) {
                $where .= " AND p.status = :status";
                $params['status'] = $statusTarget;
            }

            // ═══════════════════════════════════════════════════════════
            // FILTRO POR ESTATUS DE INVENTARIO
            // ═══════════════════════════════════════════════════════════
            if ($estatus) {
                if ($estatus === 'Sin calcular') {
                    $where .= " AND NOT EXISTS (
                        SELECT 1 FROM inv_propiedades inv
                        WHERE inv.id_propiedad_id = p.id
                          AND inv.deleted = 0
                    )";
                } else {
                    $where .= " AND EXISTS (
                        SELECT 1 FROM inv_propiedades inv
                        WHERE inv.id_propiedad_id = p.id
                          AND inv.deleted = 0
                          AND inv.estatus_propiedad = :estatus
                    )";
                    $params['estatus'] = $estatus;
                }
            }

            // ═══════════════════════════════════════════════════════════
            // FILTROS POR ROL DEL USUARIO
            // ═══════════════════════════════════════════════════════════
            if ($userInfo) {
                // Siempre excluir oficina "Venezuela" (ID 1 o nombre "Venezuela")
                $where .= " AND NOT EXISTS (
                    SELECT 1 FROM entity_team et_ven
                    INNER JOIN team t ON et_ven.team_id = t.id
                    WHERE et_ven.entity_id = p.id
                      AND et_ven.entity_type = 'Propiedades'
                      AND et_ven.deleted = 0
                      AND (t.id = '1' OR t.name = 'Venezuela')
                )";

                // Si es Casa Nacional, no hay restricciones adicionales
                if ($userInfo['esCasaNacional']) {
                    $log->info("[InvLista::getPropiedades] Usuario es Casa Nacional - sin restricciones de oficina/asesor");
                }
                // Si tiene roles de gestión (Director/Gerente)
                else if ($userInfo['tieneRolesGestion']) {
                    $oficinaUsuario = $userInfo['oficinaUsuario'];
                    if ($oficinaUsuario) {
                        $where .= " AND EXISTS (
                            SELECT 1 FROM entity_team et_of
                            WHERE et_of.entity_id = p.id
                              AND et_of.team_id = :oficinaUsuario
                              AND et_of.entity_type = 'Propiedades'
                              AND et_of.deleted = 0
                        )";
                        $params['oficinaUsuario'] = $oficinaUsuario;
                        $log->info("[InvLista::getPropiedades] Usuario gestión - filtrando por oficina: {$oficinaUsuario}");
                    }
                }
                // Si es asesor (o regular sin roles)
                else {
                    $where .= " AND p.id_asesor_exclusiva_id = :userId";
                    $params['userId'] = $userId;
                    $log->info("[InvLista::getPropiedades] Usuario asesor - filtrando por asesor: {$userId}");
                }
            }

            // ═══════════════════════════════════════════════════════════
            // FILTROS MANUALES (desde la interfaz)
            // ═══════════════════════════════════════════════════════════
            if ($asesorId) {
                $where .= " AND p.id_asesor_exclusiva_id = :asesorId";
                $params['asesorId'] = $asesorId;
            }

            if ($fechaDesde) {
                $where .= " AND p.fecha_alta >= :fechaDesde";
                $params['fechaDesde'] = $fechaDesde;
            }

            if ($fechaHasta) {
                $where .= " AND p.fecha_alta <= :fechaHasta";
                $params['fechaHasta'] = $fechaHasta;
            }

            if ($claId) {
                $where .= " AND EXISTS (
                    SELECT 1 FROM entity_team et_cla
                    WHERE et_cla.entity_id = p.id
                      AND et_cla.team_id = :claId
                      AND et_cla.entity_type = 'Propiedades'
                      AND et_cla.deleted = 0
                )";
                $params['claId'] = $claId;
            }

            if ($oficinaId) {
                $where .= " AND EXISTS (
                    SELECT 1 FROM entity_team et_of
                    WHERE et_of.entity_id = p.id
                      AND et_of.team_id = :oficinaId
                      AND et_of.entity_type = 'Propiedades'
                      AND et_of.deleted = 0
                )";
                $params['oficinaId'] = $oficinaId;
            }

            // ── 4. Contar total ────────────────────────────────────────────
            $stmtCount = $pdo->prepare("SELECT COUNT(DISTINCT p.id) as total FROM propiedades p WHERE {$where}");
            $stmtCount->execute($params);
            $total = (int)($stmtCount->fetch(\PDO::FETCH_ASSOC)['total'] ?? 0);
            $log->info("[InvLista::getPropiedades] Total con filtros: {$total}");

            if ($total === 0) {
                $log->info("[InvLista::getPropiedades] Sin resultados");
                return $this->respuestaPaginada([], 0, $pagina, $porPagina);
            }

            // ── 5. Obtener IDs de la página con LIMIT/OFFSET ───────────────
            $stmtIds = $pdo->prepare(
                "SELECT DISTINCT p.id, p.fecha_alta
                 FROM propiedades p
                 WHERE {$where}
                 ORDER BY p.fecha_alta DESC
                 LIMIT :limit OFFSET :offset"
            );
            foreach ($params as $k => $v) {
                $stmtIds->bindValue(':' . $k, $v);
            }
            $stmtIds->bindValue(':limit',  $porPagina, \PDO::PARAM_INT);
            $stmtIds->bindValue(':offset', $offset,    \PDO::PARAM_INT);
            $stmtIds->execute();
            $idsPage = $stmtIds->fetchAll(\PDO::FETCH_COLUMN);

            $log->info("[InvLista::getPropiedades] IDs en página: " . count($idsPage));

            if (empty($idsPage)) {
                return $this->respuestaPaginada([], $total, $pagina, $porPagina);
            }

            // ── 6. Cargar entidades + resolver asesor ────────────────────
            $result      = [];
            $asesorCache = [];

            foreach ($idsPage as $pid) {
                $propiedad = $em->getEntityById('Propiedades', $pid);
                if (!$propiedad) {
                    $log->warning("[InvLista::getPropiedades] getEntityById('Propiedades', '{$pid}') retornó null");
                    continue;
                }

                $aid    = $propiedad->get('idAsesorExclusivaId');
                $nombre = null;
                if ($aid) {
                    if (!array_key_exists($aid, $asesorCache)) {
                        $u = $em->getEntityById('User', $aid);
                        $asesorCache[$aid] = $u ? $u->get('name') : null;
                    }
                    $nombre = $asesorCache[$aid];
                }

                $result[] = [
                    'id'            => $propiedad->getId(),
                    'name'          => $propiedad->get('name'),
                    'fechaAlta'     => $propiedad->get('fechaAlta'),
                    'calle'         => $propiedad->get('calle')         ?? '',
                    'numero'        => $propiedad->get('numero')        ?? '',
                    'urbanizacion'  => $propiedad->get('urbanizacion')  ?? '',
                    'municipio'     => $propiedad->get('municipio')     ?? '',
                    'ciudad'        => $propiedad->get('ciudad')        ?? '',
                    'tipoPropiedad' => $propiedad->get('tipoPropiedad') ?? '',
                    'tipoOperacion' => $propiedad->get('tipoOperacion') ?? '',
                    'status'        => $propiedad->get('status')        ?? '',
                    'asesorId'      => $aid,
                    'asesorNombre'  => $nombre,
                ];
            }

            $log->info("[InvLista::getPropiedades] END OK — retornando " . count($result) . " registros");
            return $this->respuestaPaginada($result, $total, $pagina, $porPagina);

        } catch (\Exception $e) {
            $log->error("[InvLista::getPropiedades] EXCEPTION: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTODO AUXILIAR para obtener info del usuario
    // ═══════════════════════════════════════════════════════════

    private function getUserInfoData(string $userId): ?array
    {
        $em = $this->getContainer()->get('entityManager');
        $user = $em->getEntityById('User', $userId);
        if (!$user) return null;

        $oficinaUsuario = null;
        $teams = $em->getRelation($user, 'teams')->find();
        if ($teams) {
            foreach ($teams as $team) {
                $id = $team->getId();
                if (strpos($id, 'CLA') !== 0) {
                    $oficinaUsuario = $oficinaUsuario ?? $id;
                }
            }
        }
        if (!$oficinaUsuario) {
            $dtId = $user->get('defaultTeamId');
            if ($dtId && strpos($dtId, 'CLA') !== 0) $oficinaUsuario = $dtId;
        }

        $esCasaNacional = false;
        $esGerente = false;
        $esDirector = false;
        $esCoordinador = false;
        
        $roles = $em->getRelation($user, 'roles')->find();
        if ($roles) {
            foreach ($roles as $role) {
                $n = strtolower($role->get('name') ?? '');
                if (str_contains($n, 'casa nacional') || str_contains($n, 'casanacional')) {
                    $esCasaNacional = true;
                }
                if (!$esCasaNacional) {
                    if (str_contains($n, 'gerente')) $esGerente = true;
                    if (str_contains($n, 'director')) $esDirector = true;
                    if (str_contains($n, 'coordinador')) $esCoordinador = true;
                }
            }
        }

        $esAdminType = $user->get('type') === 'admin';
        $tienePoderCasaNacional = $esAdminType || $esCasaNacional;
        $tieneRolesGestion = !$tienePoderCasaNacional && ($esGerente || $esDirector || $esCoordinador);

        return [
            'esCasaNacional' => $tienePoderCasaNacional,
            'tieneRolesGestion' => $tieneRolesGestion,
            'oficinaUsuario' => $oficinaUsuario,
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // RESTO DE MÉTODOS (sin cambios)
    // ═══════════════════════════════════════════════════════════

    public function getActionGetCLAs(Request $request): array
    {
        $em    = $this->getContainer()->get('entityManager');
        $teams = $em->getRepository('Team')
            ->select(['id', 'name'])
            ->where(['deleted' => false])
            ->find();

        $clas = [];
        foreach ($teams as $team) {
            if (strpos($team->getId(), 'CLA') === 0) {
                $clas[] = ['id' => $team->getId(), 'name' => $team->get('name')];
            }
        }
        usort($clas, fn($a, $b) => strcmp($a['name'], $b['name']));

        return ['success' => true, 'data' => $clas];
    }

    public function getActionGetOficinasByCLA(Request $request): array
    {
        $claId = $request->getQueryParam('claId');
        if (!$claId) return ['success' => false, 'error' => 'claId es requerido'];

        $em  = $this->getContainer()->get('entityManager');
        $pdo = $em->getPDO();

        try {
            $stmt = $pdo->prepare("
                SELECT DISTINCT entity_id FROM entity_team
                WHERE team_id = :claId AND entity_type = 'Propiedades' AND deleted = 0
                LIMIT 5000
            ");
            $stmt->execute(['claId' => $claId]);
            $propiedadIds = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            if (empty($propiedadIds)) {
                return ['success' => true, 'data' => []];
            }

            $oficinasMap = [];
            foreach ($propiedadIds as $pid) {
                $propiedad = $em->getEntityById('Propiedades', $pid);
                if (!$propiedad) continue;
                
                $propTeams = $em->getRelation($propiedad, 'teams')->find();
                if (!$propTeams) continue;
                foreach ($propTeams as $team) {
                    $tid = $team->getId();
                    if (strpos($tid, 'CLA') === 0) continue;
                    
                    // Excluir oficina Venezuela
                    if ($tid === '1' || $team->get('name') === 'Venezuela') continue;
                    
                    $oficinasMap[$tid] = $oficinasMap[$tid] ?? $team->get('name');
                }
            }

            $oficinas = [];
            foreach ($oficinasMap as $id => $name) {
                $oficinas[] = ['id' => $id, 'name' => $name];
            }
            usort($oficinas, fn($a, $b) => strcmp($a['name'], $b['name']));

            return ['success' => true, 'data' => $oficinas];

        } catch (\Exception $e) {
            $GLOBALS['log']->error('InvLista::getOficinasByCLA - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function getActionGetAsesoresByOficina(Request $request): array
    {
        $oficinaId = $request->getQueryParam('oficinaId');
        if (!$oficinaId) return ['success' => false, 'error' => 'oficinaId es requerido'];

        $em  = $this->getContainer()->get('entityManager');
        $pdo = $em->getPDO();

        try {
            $stmt = $pdo->prepare("
                SELECT DISTINCT entity_id FROM entity_team
                WHERE team_id = :oficinaId AND entity_type = 'Propiedades' AND deleted = 0
                LIMIT 5000
            ");
            $stmt->execute(['oficinaId' => $oficinaId]);
            $propiedadIds = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            if (empty($propiedadIds)) {
                return ['success' => true, 'data' => []];
            }

            $asesoresMap = [];
            foreach ($propiedadIds as $pid) {
                $propiedad = $em->getEntityById('Propiedades', $pid);
                if (!$propiedad) continue;
                
                $asesorId = $propiedad->get('idAsesorExclusivaId');
                if (!$asesorId || isset($asesoresMap[$asesorId])) continue;
                
                $asesor = $em->getEntityById('User', $asesorId);
                if (!$asesor || $asesor->get('deleted') || !$asesor->get('isActive')) continue;
                $asesoresMap[$asesorId] = $asesor->get('name');
            }

            $asesores = [];
            foreach ($asesoresMap as $id => $name) {
                $asesores[] = ['id' => $id, 'name' => $name];
            }
            usort($asesores, fn($a, $b) => strcmp($a['name'], $b['name']));

            return ['success' => true, 'data' => $asesores];

        } catch (\Exception $e) {
            $GLOBALS['log']->error('InvLista::getAsesoresByOficina - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function postActionGetInventarioData(Request $request): array
    {
        $data = $request->getParsedBody();
        if (is_object($data)) $data = (array)$data;
        $propiedadIds = $data['propiedadIds'] ?? [];
        if (is_object($propiedadIds)) $propiedadIds = (array)$propiedadIds;
        if (empty($propiedadIds)) return ['success' => true, 'data' => []];

        $em = $this->getContainer()->get('entityManager');

        try {
            $resultado = [];
            foreach ($propiedadIds as $pid) {
                $inv = $em->getRepository('InvPropiedades')
                    ->where(['idPropiedadId' => $pid, 'deleted' => false])
                    ->findOne();
                if ($inv) {
                    $resultado[$pid] = [
                        'id'               => $inv->getId(),
                        'estatusPropiedad' => $inv->get('estatusPropiedad') ?? 'Sin calcular',
                        'demanda'          => $inv->get('demanda')          ?? 'Sin definir',
                        'apoderado'        => (bool)$inv->get('apoderado'),
                    ];
                }
            }
            return ['success' => true, 'data' => $resultado];

        } catch (\Exception $e) {
            $GLOBALS['log']->error('InvLista::getInventarioData - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function getActionGetInfoOficina(Request $request): array
    {
        $oficinaId = $request->getQueryParam('oficinaId');
        if (!$oficinaId) return ['success' => false, 'error' => 'oficinaId es requerido'];
        $team = $this->getContainer()->get('entityManager')->getEntityById('Team', $oficinaId);
        if (!$team) return ['success' => false, 'error' => 'Oficina no encontrada'];
        return ['success' => true, 'data' => ['nombreOficina' => $team->get('name')]];
    }

    private function detectarStatusPromocion(\PDO $pdo, $log): ?string
    {
        $posibles = ['En promocion', 'En Promocion', 'EN PROMOCION', 'en_promocion', 'En Promoción', 'Activo', 'activo'];

        $rows = $pdo->query("SELECT DISTINCT status FROM propiedades WHERE deleted=0 LIMIT 50")
                    ->fetchAll(\PDO::FETCH_COLUMN);

        $log->info("[InvLista] Status disponibles: " . implode(', ', array_map(fn($s) => "'{$s}'", $rows)));

        foreach ($posibles as $posible) {
            if (in_array($posible, $rows, true)) {
                return $posible;
            }
        }

        foreach ($rows as $row) {
            if (stripos($row, 'promo') !== false) {
                $log->info("[InvLista] Status detectado por fuzzy: '{$row}'");
                return $row;
            }
        }

        $log->warning("[InvLista] No se detectó status de 'promocion'. Se cargarán todas las propiedades activas.");
        return null;
    }

    private function respuestaPaginada(array $data, int $total, int $pagina, int $porPagina): array
    {
        return [
            'success'    => true,
            'data'       => $data,
            'paginacion' => [
                'pagina'       => $pagina,
                'porPagina'    => $porPagina,
                'total'        => $total,
                'totalPaginas' => $porPagina > 0 ? (int)ceil($total / $porPagina) : 0,
            ],
        ];
    }
}