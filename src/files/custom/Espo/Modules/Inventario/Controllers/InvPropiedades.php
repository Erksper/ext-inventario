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
            return ['success' => false, 'error' => 'propiedadId es requerido'];
        }

        $entityManager = $this->getContainer()->get('entityManager');

        // La entidad Propiedades vive en otro módulo; entityManager la encuentra por nombre igual
        $propiedad = $entityManager->getEntity('Propiedades', $propiedadId);
        if (!$propiedad) {
            return ['success' => false, 'error' => 'Propiedad no encontrada'];
        }

        $inventario = $entityManager->getRepository('InvPropiedades')
            ->where(['idPropiedadId' => $propiedadId, 'deleted' => false])
            ->findOne();

        if (!$inventario) {
            $inventario = $entityManager->getEntity('InvPropiedades');
            $inventario->set([
                'idPropiedadId'  => $propiedadId,
                'name'           => 'Inventario - ' . $propiedad->get('name'),
                'tipoPersona'    => 'Natural',
                'buyer'          => 'Comprador',
                'precio'         => 'Fuera del rango de precio',
                'ubicacion'      => 'Ubicación no atractiva',
                'exclusividad'   => 'Sin exclusividad',
                'demanda'        => 'Baja demanda',
                'apoderado'      => false,
                'estatusPropiedad' => 'Rojo',
            ]);
            $entityManager->saveEntity($inventario);
        }

        // ═══════════════════════════════════════════════════════════
        // CORRECCIÓN 1: Obtener asesor usando getRelation()
        // ═══════════════════════════════════════════════════════════
        $asesorNombre = null;
        $asesorExclusiva = $entityManager->getRelation($propiedad, 'idAsesorExclusiva')->findOne();
        if ($asesorExclusiva) {
            $asesorNombre = $asesorExclusiva->get('name');
        }

        // Construir ubicación legible
        $partes = array_filter([
            $propiedad->get('calle'),
            $propiedad->get('numero'),
            $propiedad->get('urbanizacion'),
            $propiedad->get('municipio'),
            $propiedad->get('ciudad'),
        ]);
        $ubicacionTexto = implode(', ', $partes);

        return [
            'success' => true,
            'data' => [
                'inventario' => [
                    'id'              => $inventario->get('id'),
                    'tipoPersona'     => $inventario->get('tipoPersona'),
                    'buyer'           => $inventario->get('buyer'),
                    'buyerPersona'    => $inventario->get('buyer'),
                    'precio'          => $inventario->get('precio'),
                    'ubicacion'       => $inventario->get('ubicacion'),
                    'exclusividad'    => $inventario->get('exclusividad'),
                    'apoderado'       => $inventario->get('apoderado'),
                    'demanda'         => $inventario->get('demanda'),
                    'estatusPropiedad'=> $inventario->get('estatusPropiedad'),
                ],
                'propiedad' => [
                    'id'              => $propiedad->get('id'),
                    'name'            => $propiedad->get('name'),
                    'tipoOperacion'   => $propiedad->get('tipoOperacion'),
                    'tipoPropiedad'   => $propiedad->get('tipoPropiedad'),
                    'subTipoPropiedad'=> $propiedad->get('subTipoPropiedad'),
                    'precioEnContrato' => $propiedad->get('precioEnContrato'), // ← Verificar
                    'monedaEnContrato' => $propiedad->get('monedaEnContrato'),
                    'm2C'             => $propiedad->get('m2C'),
                    'm2T'             => $propiedad->get('m2T'),
                    'ubicacion'       => $ubicacionTexto,
                    'asesorNombre'    => $asesorNombre,
                    'fechaAlta'       => $propiedad->get('fechaAlta'),
                    'status'          => $propiedad->get('status'),
                ]
            ]
        ];
    }

    public function getActionGetSubBuyersPropiedad(Request $request): array
    {
        $inventarioId = $request->getQueryParam('inventarioId');
        if (!$inventarioId) {
            return ['success' => false, 'error' => 'inventarioId es requerido'];
        }

        try {
            $entityManager = $this->getContainer()->get('entityManager');
            $inventario = $entityManager->getEntity('InvPropiedades', $inventarioId);
            if (!$inventario) {
                return ['success' => false, 'error' => 'Inventario no encontrado'];
            }

            $subBuyers = [];
            
            // ═══════════════════════════════════════════════════════════
            // CORRECCIÓN 2: Usar getRelation() para obtener subBuyers
            // ═══════════════════════════════════════════════════════════
            try {
                $subBuyerCollection = $entityManager->getRelation($inventario, 'subBuyers')->find();
                foreach ($subBuyerCollection as $subBuyer) {
                    $subBuyers[] = [
                        'id'    => $subBuyer->get('id'),
                        'name'  => $subBuyer->get('name'),
                        'buyer' => $subBuyer->get('buyer'),
                    ];
                }
            } catch (\Exception $e) {
                // Fallback a PDO si la relación no funciona
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
                foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                    $subBuyers[] = ['id' => $row['id'], 'name' => $row['name'], 'buyer' => $row['buyer']];
                }
            }

            return ['success' => true, 'data' => $subBuyers];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function getActionGetRecaudosGuardados(Request $request): array
    {
        $propiedadId = $request->getQueryParam('propiedadId');
        $tipo        = $request->getQueryParam('tipo');

        if (!$propiedadId || !$tipo) {
            return ['success' => false, 'error' => 'propiedadId y tipo son requeridos'];
        }

        $entityManager = $this->getContainer()->get('entityManager');

        $inventario = $entityManager->getRepository('InvPropiedades')
            ->where(['idPropiedadId' => $propiedadId, 'deleted' => false])
            ->findOne();

        if (!$inventario) {
            return ['success' => false, 'error' => 'Inventario no encontrado'];
        }

        $recaudosGuardados = $entityManager->getRepository('InvPropiedadesRecaudos')
            ->join('idRecaudos')
            ->where([
                'idInvPropiedadesId' => $inventario->get('id'),
                'idRecaudos.tipo'    => $tipo,
                'deleted'            => false,
            ])
            ->find();

        $recaudos     = [];
        $esPorDefecto = true;

        foreach ($recaudosGuardados as $rel) {
            // ═══════════════════════════════════════════════════════════
            // CORRECCIÓN 3: Obtener recaudo usando getRelation()
            // ═══════════════════════════════════════════════════════════
            $recaudo = $entityManager->getRelation($rel, 'idRecaudos')->findOne();
            if ($recaudo) {
                $recaudos[] = [
                    'id'          => $recaudo->get('id'),
                    'name'        => $recaudo->get('name'),
                    'descripcion' => $recaudo->get('descripcion') ?? '',
                    'default'     => $recaudo->get('default') ?? false,
                    'tipo'        => $recaudo->get('tipo'),
                    'estado'      => $rel->get('estado') ?? 'Modificar/No Tiene',
                ];
                if (!$recaudo->get('default')) {
                    $esPorDefecto = false;
                }
            }
        }

        if (count($recaudos) === 0) {
            $recaudosDefault = $entityManager->getRepository('InvRecaudos')
                ->where(['tipo' => $tipo, 'default' => true, 'deleted' => false])
                ->find();
            foreach ($recaudosDefault as $recaudo) {
                $recaudos[] = [
                    'id'          => $recaudo->get('id'),
                    'name'        => $recaudo->get('name'),
                    'descripcion' => $recaudo->get('descripcion') ?? '',
                    'default'     => true,
                    'tipo'        => $recaudo->get('tipo'),
                    'estado'      => 'Modificar/No Tiene',
                ];
            }
            $esPorDefecto = true;
        }

        return [
            'success' => true,
            'data'    => ['recaudos' => $recaudos, 'esPorDefecto' => $esPorDefecto]
        ];
    }

    public function getActionGetRecaudosByTipo(Request $request): array
    {
        $tipo = $request->getQueryParam('tipo');
        if (!$tipo) {
            return ['success' => false, 'error' => 'tipo es requerido'];
        }

        $entityManager = $this->getContainer()->get('entityManager');
        $recaudos = $entityManager->getRepository('InvRecaudos')
            ->where(['tipo' => $tipo, 'deleted' => false])
            ->order('name', 'ASC')
            ->find();

        $resultado = [];
        foreach ($recaudos as $recaudo) {
            $resultado[] = [
                'id'          => $recaudo->get('id'),
                'name'        => $recaudo->get('name'),
                'descripcion' => $recaudo->get('descripcion') ?? '',
                'default'     => $recaudo->get('default') ?? false,
                'tipo'        => $recaudo->get('tipo'),
            ];
        }

        return ['success' => true, 'data' => $resultado];
    }

    public function getActionGetSubBuyersByBuyer(Request $request): array
    {
        $buyer = $request->getQueryParam('buyer');
        if (!$buyer) {
            return ['success' => false, 'error' => 'buyer es requerido'];
        }

        try {
            $entityManager = $this->getContainer()->get('entityManager');
            $subBuyers = $entityManager->getRepository('InvSubBuyer')
                ->where(['buyer' => $buyer, 'deleted' => false])
                ->order('name', 'ASC')
                ->find();

            $resultado = [];
            foreach ($subBuyers as $sb) {
                $resultado[] = ['id' => $sb->get('id'), 'name' => $sb->get('name'), 'buyer' => $sb->get('buyer')];
            }

            return ['success' => true, 'data' => $resultado];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Guardar inventario completo - versión incremental
     */
    public function postActionSave(Request $request): array
    {
        $data = $request->getParsedBody();
        if (is_object($data)) {
            $data = json_decode(json_encode($data), true);
        }

        $inventarioId = $data['inventarioId'] ?? null;
        if (!$inventarioId) {
            throw new BadRequest('inventarioId es requerido');
        }

        $entityManager = $this->getContainer()->get('entityManager');
        $inventario = $entityManager->getEntity('InvPropiedades', $inventarioId);
        if (!$inventario) {
            throw new BadRequest('Inventario no encontrado');
        }

        $notaLegal     = $this->calcularNota($data, 'legal');
        $notaMercadeo  = $this->calcularNota($data, 'mercadeo');
        $notaPrecio    = $this->mapearNotaOtros($data['precio'] ?? '');
        $notaExclusiva = $this->mapearNotaOtros($data['exclusividad'] ?? '');
        $notaUbicacion = $this->mapearNotaOtros($data['ubicacion'] ?? '');

        $inventario->set([
            'tipoPersona'    => $data['tipoPersona']   ?? $inventario->get('tipoPersona'),
            'buyer'          => $data['buyer']         ?? $data['buyerPersona'] ?? $inventario->get('buyer'),
            'demanda'        => $data['demanda']       ?? $inventario->get('demanda'),
            'precio'         => $data['precio']        ?? $inventario->get('precio'),
            'ubicacion'      => $data['ubicacion']     ?? $inventario->get('ubicacion'),
            'exclusividad'   => $data['exclusividad']  ?? $inventario->get('exclusividad'),
            'apoderado'      => isset($data['apoderado'])
                ? ($data['apoderado'] === 'true' || $data['apoderado'] === true)
                : $inventario->get('apoderado'),
            'estatusPropiedad' => $data['estatusPropiedad'] ?? 'Rojo',
            'notaLegal'      => $notaLegal,
            'notaMercadeo'   => $notaMercadeo,
            'notaPrecio'     => $notaPrecio,
            'notaExclusiva'  => $notaExclusiva,
            'notaUbicacion'  => $notaUbicacion,
        ]);
        $entityManager->saveEntity($inventario);

        if (isset($data['subBuyers']) && is_array($data['subBuyers'])) {
            $this->guardarSubBuyers($inventario, $data['subBuyers']);
        }

        $stats = ['creados' => 0, 'actualizados' => 0, 'eliminados' => 0];

        foreach (['recaudosLegal' => 'valoresRecaudosLegal', 'recaudosMercadeo' => 'valoresRecaudosMercadeo', 'recaudosApoderado' => 'valoresRecaudosApoderado'] as $key => $valKey) {
            if (isset($data[$key])) {
                $r = $this->guardarRecaudosIncremental($inventario, $data[$key], $data[$valKey] ?? []);
                $stats['creados']      += $r['creados'];
                $stats['actualizados'] += $r['actualizados'];
                $stats['eliminados']   += $r['eliminados'];
            }
        }

        return ['success' => true, 'message' => 'Inventario guardado exitosamente', 'stats' => $stats];
    }

    public function getActionGetRecaudosApoderado(Request $request): array
    {
        $inventarioId = $request->getQueryParam('inventarioId');
        if (!$inventarioId) {
            return ['success' => false, 'error' => 'inventarioId es requerido'];
        }

        try {
            $entityManager = $this->getContainer()->get('entityManager');
            $inventario = $entityManager->getEntity('InvPropiedades', $inventarioId);
            if (!$inventario) {
                return ['success' => false, 'error' => 'Inventario no encontrado'];
            }

            $recaudosGuardados = $entityManager->getRepository('InvPropiedadesRecaudos')
                ->join('idRecaudos')
                ->where([
                    'idInvPropiedadesId' => $inventario->get('id'),
                    'idRecaudos.tipo'    => 'Apoderado',
                    'deleted'            => false,
                ])
                ->find();

            $recaudos = [];
            foreach ($recaudosGuardados as $rel) {
                // ═══════════════════════════════════════════════════════════
                // CORRECCIÓN 4: Obtener recaudo usando getRelation()
                // ═══════════════════════════════════════════════════════════
                $recaudo = $entityManager->getRelation($rel, 'idRecaudos')->findOne();
                if ($recaudo) {
                    $recaudos[] = [
                        'id'     => $recaudo->get('id'),
                        'name'   => $recaudo->get('name'),
                        'estado' => $rel->get('estado') ?? 'Modificar/No Tiene',
                    ];
                }
            }

            return ['success' => true, 'data' => ['recaudos' => $recaudos]];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    // ===== MÉTODOS PRIVADOS =====

    private function guardarRecaudosIncremental($inventario, $recaudosArray, $valoresArray): array
    {
        $entityManager = $this->getContainer()->get('entityManager');
        $inventarioId  = $inventario->get('id');

        if (is_object($recaudosArray)) $recaudosArray = json_decode(json_encode($recaudosArray), true);
        if (is_object($valoresArray))  $valoresArray  = json_decode(json_encode($valoresArray), true);

        if (!is_array($recaudosArray) || count($recaudosArray) === 0) {
            return ['creados' => 0, 'actualizados' => 0, 'eliminados' => 0];
        }

        $creados = $actualizados = $eliminados = 0;

        $recaudosIdsActuales = [];
        foreach ($recaudosArray as $recaudo) {
            if (is_object($recaudo)) $recaudo = json_decode(json_encode($recaudo), true);
            if (isset($recaudo['recaudoId'])) {
                $recaudosIdsActuales[] = strval($recaudo['recaudoId']);
            }
        }

        if (count($recaudosIdsActuales) === 0) {
            return ['creados' => 0, 'actualizados' => 0, 'eliminados' => 0];
        }

        $primerRecaudo = $entityManager->getEntity('InvRecaudos', $recaudosIdsActuales[0]);
        if (!$primerRecaudo) {
            return ['creados' => 0, 'actualizados' => 0, 'eliminados' => 0];
        }
        $tipoGrupo = $primerRecaudo->get('tipo');

        $pdo  = $entityManager->getPDO();
        $stmt = $pdo->prepare("
            SELECT pr.id, pr.id_recaudos_id, pr.estado
            FROM inv_propiedades_recaudos pr
            INNER JOIN inv_recaudos r ON pr.id_recaudos_id = r.id
            WHERE pr.id_inv_propiedades_id = :invId
              AND r.tipo = :tipo
              AND pr.deleted = 0
        ");
        $stmt->execute(['invId' => $inventarioId, 'tipo' => $tipoGrupo]);
        $recaudosExistentes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($recaudosExistentes as $rel) {
            if (!in_array(strval($rel['id_recaudos_id']), $recaudosIdsActuales, true)) {
                $relacion = $entityManager->getEntity('InvPropiedadesRecaudos', $rel['id']);
                if ($relacion) {
                    $relacion->set('deleted', true);
                    $entityManager->saveEntity($relacion);
                    $eliminados++;
                }
            }
        }

        foreach ($recaudosArray as $recaudoData) {
            if (is_object($recaudoData)) $recaudoData = json_decode(json_encode($recaudoData), true);
            if (!is_array($recaudoData)) continue;

            $recaudoId    = strval($recaudoData['recaudoId'] ?? '');
            if (!$recaudoId) continue;

            $estado = $valoresArray[$recaudoId] ?? ($recaudoData['estado'] ?? 'Modificar/No Tiene');

            $relacion = $entityManager->getRepository('InvPropiedadesRecaudos')
                ->where(['idInvPropiedadesId' => $inventarioId, 'idRecaudosId' => $recaudoId])
                ->findOne();

            if ($relacion) {
                if ($relacion->get('estado') !== $estado || $relacion->get('deleted')) {
                    $relacion->set(['estado' => $estado, 'deleted' => false]);
                    $entityManager->saveEntity($relacion);
                    $actualizados++;
                }
            } else {
                $relacion = $entityManager->getEntity('InvPropiedadesRecaudos');
                $relacion->set([
                    'idInvPropiedadesId' => $inventarioId,
                    'idRecaudosId'       => $recaudoId,
                    'estado'             => $estado,
                    'deleted'            => false,
                ]);
                $entityManager->saveEntity($relacion);
                $creados++;
            }
        }

        return ['creados' => $creados, 'actualizados' => $actualizados, 'eliminados' => $eliminados];
    }

    private function calcularNota($data, $tipo): string
    {
        $recaudos = $tipo === 'legal' ? ($data['recaudosLegal'] ?? []) : ($data['recaudosMercadeo'] ?? []);
        $valores  = $tipo === 'legal' ? ($data['valoresRecaudosLegal'] ?? []) : ($data['valoresRecaudosMercadeo'] ?? []);

        if (is_object($recaudos)) $recaudos = json_decode(json_encode($recaudos), true);
        if (is_object($valores))  $valores  = json_decode(json_encode($valores), true);
        if (!is_array($recaudos) || count($recaudos) === 0) return 'Modificar';

        $total    = count($recaudos);
        $completos = 0;
        foreach ($recaudos as $recaudo) {
            if (is_object($recaudo)) $recaudo = json_decode(json_encode($recaudo), true);
            $id = $recaudo['recaudoId'] ?? null;
            if (!$id) continue;
            if (($valores[$id] ?? ($recaudo['estado'] ?? '')) === 'Adecuado') $completos++;
        }

        $pct = $total > 0 ? round(($completos / $total) * 100) : 0;
        if ($tipo === 'legal') {
            return $pct >= 90 ? 'Adecuado' : ($pct >= 80 ? 'Revisar' : 'Modificar');
        }
        return $pct >= 90 ? 'Adecuado' : ($pct >= 70 ? 'Revisar' : 'Modificar');
    }

    private function mapearNotaOtros($valor): string
    {
        $verdes    = ['Exclusividad pura o total con contrato firmado', 'En rango', 'Ubicación atractiva', 'Alta demanda'];
        $amarillos = ['Exclusividad interna de CENTURY con contrato firmado', 'Cercano al rango de precio', 'Ubicación medianamente atractiva', 'Media demanda'];
        if (in_array($valor, $verdes))    return 'Adecuado';
        if (in_array($valor, $amarillos)) return 'Revisar';
        return 'Modificar';
    }

    private function guardarSubBuyers($inventario, $subBuyersIds)
    {
        $entityManager = $this->getContainer()->get('entityManager');
        $inventarioId = $inventario->get('id');
        
        // Si no hay IDs, no hacemos nada
        if (!is_array($subBuyersIds)) {
            return;
        }
        
        try {
            // Intentar usar el ORM primero
            $actuales = $entityManager->getRelation($inventario, 'subBuyers')->find();
            $actualesIds = [];
            foreach ($actuales as $sb) {
                $actualesIds[] = $sb->get('id');
            }

            // Eliminar los que ya no están
            foreach ($actualesIds as $actualId) {
                if (!in_array($actualId, $subBuyersIds)) {
                    $entityManager->getRelation($inventario, 'subBuyers')->unrelateById($actualId);
                }
            }
            
            // Agregar los nuevos
            foreach ($subBuyersIds as $newId) {
                if (!in_array($newId, $actualesIds)) {
                    $entityManager->getRelation($inventario, 'subBuyers')->relateById($newId);
                }
            }
            
        } catch (\Exception $e) {
            // Si el ORM falla, registrar el error pero no detener la operación
            $GLOBALS['log']->error('Error al guardar subBuyers con ORM: ' . $e->getMessage());
            
            // Como no podemos usar el ORM, al menos intentamos con PDO
            try {
                $pdo = $entityManager->getPDO();
                
                // Primero marcar todos como eliminados
                $pdo->prepare("UPDATE inv_propiedades_inv_sub_buyer SET deleted = 1 WHERE inv_propiedades_id = :id")
                    ->execute(['id' => $inventarioId]);
                
                // Luego insertar/actualizar los nuevos
                foreach ($subBuyersIds as $sbId) {
                    // Verificar si ya existe
                    $stmt = $pdo->prepare("SELECT id FROM inv_propiedades_inv_sub_buyer WHERE inv_propiedades_id = :invId AND inv_sub_buyer_id = :sbId");
                    $stmt->execute(['invId' => $inventarioId, 'sbId' => $sbId]);
                    $existe = $stmt->fetch();
                    
                    if ($existe) {
                        // Actualizar
                        $pdo->prepare("UPDATE inv_propiedades_inv_sub_buyer SET deleted = 0 WHERE inv_propiedades_id = :invId AND inv_sub_buyer_id = :sbId")
                            ->execute(['invId' => $inventarioId, 'sbId' => $sbId]);
                    } else {
                        // Insertar nuevo
                        $id = uniqid(); // Generar ID único
                        $pdo->prepare("INSERT INTO inv_propiedades_inv_sub_buyer (id, inv_propiedades_id, inv_sub_buyer_id, deleted) VALUES (:id, :invId, :sbId, 0)")
                            ->execute(['id' => $id, 'invId' => $inventarioId, 'sbId' => $sbId]);
                    }
                }
            } catch (\Exception $ex) {
                $GLOBALS['log']->error('Error al guardar subBuyers con PDO: ' . $ex->getMessage());
            }
        }
    }
}