_delimiter_0xcbuk0y8p7
custom/modules/inventario/res/templates/propiedad.tpl
<link rel="stylesheet" type="text/css" href="client/custom/modules/inventario/res/styles/inv-propiedades.css">
<div class="container-fluid inv-propiedad-container">
    <!-- Header principal -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="page-header-card">
                <div class="d-flex justify-content-between align-items-start flex-wrap">
                    <div class="header-left" style="flex: 1;">
                        <div class="header-icon">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                        <div class="header-content">
                            <h1 class="page-title">Análisis de Inventario de Propiedades</h1>
                            <p class="page-subtitle" id="propiedad-nombre"></p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-secondary" data-action="volver">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loader -->
    <div id="loading-container" style="text-align: center; padding: 80px 20px;">
        <div class="spinner-large"></div>
        <h4 class="mt-4" style="color: #1A1A1A; font-weight: 600; margin-bottom: 10px;">
            Cargando datos...
        </h4>
    </div>

    <!-- Contenido (oculto inicialmente) -->
    <div id="form-container" style="display: none;">

        <!-- Panel 1: Información de la Propiedad -->
        <div class="panel">
            <div class="panel-heading" data-action="toggle-panel">
                <h4 class="panel-title">
                    <i class="fas fa-home"></i> Información de la Propiedad
                    <span class="fas fa-chevron-up"></span>
                </h4>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="info-item">
                            <div class="info-label">Tipo de Operación</div>
                            <div class="info-value" id="prop-tipoOperacion">-</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="info-item">
                            <div class="info-label">Tipo de Propiedad</div>
                            <div class="info-value" id="prop-tipoPropiedad">-</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="info-item">
                            <div class="info-label">Sub Tipo de Propiedad</div>
                            <div class="info-value" id="prop-subTipoPropiedad">-</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <div class="info-item">
                            <div class="info-label">M² Construcción</div>
                            <div class="info-value" id="prop-m2C">-</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="info-item">
                            <div class="info-label">M² Terreno</div>
                            <div class="info-value" id="prop-m2T">-</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="info-item">
                            <div class="info-label">Ubicación</div>
                            <div class="info-value" id="prop-ubicacion">-</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <div class="info-item">
                            <div class="info-label">Asesor Encargado</div>
                            <div class="info-value" id="prop-asesor">-</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="info-item">
                            <div class="info-label">Fecha de Publicación</div>
                            <div class="info-value" id="prop-fechaAlta">-</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="info-item">
                            <div class="info-label">Días en el Mercado</div>
                            <div class="info-value" id="prop-diasMercado">-</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="info-item">
                            <div class="info-label">Estado</div>
                            <div class="info-value">
                                <span class="badge" id="prop-status">-</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row" style="margin-top: 20px;">
                    <div class="col-md-12">
                        <div class="alert alert-info" style="margin-bottom: 0;">
                            <i class="fas fa-info-circle"></i>
                            <strong>Nota:</strong> Cualquier cambio que se requiera hacer a estos datos debe hacerse en el sistema 21Online. Cualquier duda consulte a su asesor de casa nacional.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel 2: Requisitos legales del inmueble -->
        <div class="panel">
            <div class="panel-heading" data-action="toggle-panel">
                <h4 class="panel-title">
                    <i class="fas fa-gavel"></i> Requisitos legales del inmueble
                    <span class="nota-percentaje" style="float: right; margin-left: 10px; font-weight: bold; color: #666;">
                        <span id="nota-legal">0%</span>
                    </span>
                    <span class="fas fa-chevron-down"></span>
                </h4>
            </div>
            <div class="panel-body" style="display: none;">
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Tipo de Persona</label>
                            <select id="tipoPersona" class="form-control tipo-persona-select">
                                <option value="Natural">Natural</option>
                                <option value="Juridico">Jurídico</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div id="contenedor-recaudos-legal">
                    <div class="text-center" style="padding: 20px;">
                        <div class="spinner-small"></div>
                        <p>Cargando requisitos legales...</p>
                    </div>
                </div>
                <div class="agregar-recaudo-panel" id="panel-agregar-legal" style="margin-top: 20px; display: none;">
                    <div class="panel panel-default">
                        <div class="panel-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <select id="select-agregar-legal" class="form-control">
                                        <option value="">Seleccione un requisito para agregar</option>
                                        <option value="crear_nuevo">+ Crear nuevo requisito</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-success btn-agregar-recaudo" data-tipo="legal">
                                        <i class="fas fa-plus"></i> Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel 3: Mercadeo -->
        <div class="panel">
            <div class="panel-heading" data-action="toggle-panel">
                <h4 class="panel-title">
                    <i class="fas fa-chart-line"></i> Mercadeo
                    <span class="nota-percentaje" style="float: right; margin-left: 10px; font-weight: bold; color: #666;">
                        <span id="nota-mercadeo">0%</span>
                    </span>
                    <span class="fas fa-chevron-down"></span>
                </h4>
            </div>
            <div class="panel-body" style="display: none;">
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Buyer Persona</label>
                            <!-- Solo Comprador y Arrendatario, igual que entityDefs -->
                            <select id="buyerPersona" class="form-control">
                                <option value="Comprador">Comprador</option>
                                <option value="Arrendatario">Arrendatario</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <label class="form-label">Sub Buyer Persona</label>
                            <div id="subbuyers-checkbox-container" class="subbuyers-checkbox-grid">
                                <div class="text-center" style="padding: 20px; color: #999;">
                                    <i class="fas fa-spinner fa-spin"></i> Cargando opciones...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="contenedor-recaudos-mercadeo">
                    <div class="text-center" style="padding: 20px;">
                        <div class="spinner-small"></div>
                        <p>Cargando elementos de mercadeo...</p>
                    </div>
                </div>
                <div class="agregar-recaudo-panel" id="panel-agregar-mercadeo" style="margin-top: 20px; display: none;">
                    <div class="panel panel-default">
                        <div class="panel-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <select id="select-agregar-mercadeo" class="form-control">
                                        <option value="">Seleccione un elemento para agregar</option>
                                        <option value="crear_nuevo">+ Crear nuevo elemento</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-success btn-agregar-recaudo" data-tipo="mercadeo">
                                        <i class="fas fa-plus"></i> Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel 4: Otros (MOVIDO ANTES DE APODERADO) -->
        <div class="panel">
            <div class="panel-heading" data-action="toggle-panel">
                <h4 class="panel-title">
                    <i class="fas fa-ellipsis-h"></i> Otros
                    <span class="fas fa-chevron-down"></span>
                </h4>
            </div>
            <div class="panel-body" style="display: none;">
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label class="form-label">Exclusividad</label>
                            <select id="select-exclusividad" class="form-control select-otros" data-campo="exclusividad">
                                <option value="Exclusividad pura o total con contrato firmado">Exclusividad pura o total con contrato firmado</option>
                                <option value="Exclusividad interna de CENTURY con contrato firmado">Exclusividad interna de CENTURY con contrato firmado</option>
                                <option value="Sin exclusividad">Sin exclusividad</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label class="form-label">Precio</label>
                            <select id="select-precio" class="form-control select-otros" data-campo="precio">
                                <option value="En rango">En rango</option>
                                <option value="Cercano al rango de precio">Cercano al rango de precio</option>
                                <option value="Fuera del rango de precio">Fuera del rango de precio</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label class="form-label">Ubicación</label>
                            <select id="select-ubicacion" class="form-control select-otros" data-campo="ubicacion">
                                <option value="Ubicación atractiva">Ubicación atractiva</option>
                                <option value="Ubicación medianamente atractiva">Ubicación medianamente atractiva</option>
                                <option value="Ubicación no atractiva">Ubicación no atractiva</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label class="form-label">Demanda</label>
                            <select id="select-demanda" class="form-control select-otros" data-campo="demanda">
                                <option value="Alta demanda">Alta demanda</option>
                                <option value="Media demanda">Media demanda</option>
                                <option value="Baja demanda">Baja demanda</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel 5: Apoderado (SIN badge de estado en el título) -->
        <div class="panel">
            <div class="panel-heading" data-action="toggle-panel">
                <h4 class="panel-title">
                    <i class="fas fa-user-check"></i> Apoderado
                    <!-- Badge eliminado: antes era <span id="nota-apoderado"> con cuadrito de color -->
                    <span class="fas fa-chevron-down"></span>
                </h4>
            </div>
            <div class="panel-body" style="display: none;">
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <label class="form-label">¿Cuenta con apoderado?</label>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="apoderado" value="true"> Lo tiene
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="apoderado" value="false" checked> No lo tiene
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="contenedor-recaudos-apoderado" style="display: none; margin-top: 20px;">
                    <div class="text-center" style="padding: 20px;">
                        <div class="spinner-small"></div>
                        <p>Cargando requisitos de apoderado...</p>
                    </div>
                </div>
                <div class="agregar-recaudo-panel" id="panel-agregar-apoderado" style="margin-top: 20px; display: none;">
                    <div class="panel panel-default">
                        <div class="panel-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <select id="select-agregar-apoderado" class="form-control">
                                        <option value="">Seleccione un requisito para agregar</option>
                                        <option value="crear_nuevo">+ Crear nuevo requisito</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-success btn-agregar-recaudo" data-tipo="apoderado">
                                        <i class="fas fa-plus"></i> Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Botones de acción -->
        <div class="form-actions">
            <button class="btn btn-default" data-action="cancelar">
                <i class="fas fa-times"></i> Cancelar
            </button>
            <button class="btn btn-primary" data-action="guardar">
                <i class="fas fa-save"></i> Guardar Inventario
            </button>
        </div>
    </div>
</div>

<!-- Modal crear recaudo -->
<div class="modal fade" id="modalCrearRecaudo" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title"><i class="fas fa-plus-circle"></i> <span id="modalTitulo">Crear Nuevo Recaudo</span></h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Nombre del Recaudo *</label>
                    <input type="text" id="nombreRecaudo" class="form-control" placeholder="Ingrese el nombre del recaudo">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea id="descripcionRecaudo" class="form-control" rows="3" placeholder="Ingrese una descripción (opcional)"></textarea>
                </div>
                <input type="hidden" id="tipoRecaudoModal" value="">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnGuardarRecaudo">
                    <i class="fas fa-save"></i> Guardar Recaudo
                </button>
            </div>
        </div>
    </div>
</div>

_delimiter_0xcbuk0y8p7
custom/modules/inventario/res/templates/list.tpl
<div class="container-fluid inv-inventario-container">

    <!-- Header -->
    <div class="inv-page-header">
        <div class="inv-header-icon"><i class="fas fa-building"></i></div>
        <div>
            <h1 class="inv-page-title">Inventario de Propiedades</h1>
            <p class="inv-page-sub">Gestión y visualización del inventario inmobiliario</p>
        </div>
    </div>

    <!-- Filtros -->
    <div class="inv-card mb-4">
        <div class="inv-card-header">
            <i class="fas fa-filter" style="color:#B8A279;"></i>
            <strong style="margin-left:8px;">Filtrar Propiedades</strong>
        </div>
        <div class="inv-card-body">
            <div class="inv-filtros-grid">

                <div class="filter-group" id="filtro-cla-group">
                    <label>CLA</label>
                    <select id="filtro-cla" class="form-control inv-select">
                        <option value="">Todos los CLAs</option>
                    </select>
                </div>

                <div class="filter-group" id="filtro-oficina-group">
                    <label>Oficina</label>
                    <select id="filtro-oficina" class="form-control inv-select" disabled>
                        <option value="">Seleccione un CLA primero</option>
                    </select>
                </div>

                <div class="filter-group" id="filtro-asesor-group">
                    <label>Asesor</label>
                    <select id="filtro-asesor" class="form-control inv-select" disabled>
                        <option value="">Todos los asesores</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>Desde</label>
                    <input type="date" id="filtro-fecha-desde" class="form-control inv-select">
                </div>

                <div class="filter-group">
                    <label>Hasta</label>
                    <input type="date" id="filtro-fecha-hasta" class="form-control inv-select">
                </div>

            </div>
            <div class="inv-filtro-actions">
                <button class="inv-btn inv-btn-primary" data-action="aplicar-filtros">
                    <i class="fas fa-search"></i> Buscar
                </button>
                <button class="inv-btn inv-btn-secondary" data-action="limpiar-filtros">
                    <i class="fas fa-times"></i> Limpiar
                </button>
            </div>
        </div>
    </div>

    <!-- Contador + leyenda -->
    <div class="inv-meta-row">
        <div class="inv-contador">
            <i class="fas fa-home" style="color:#B8A279;margin-right:6px;"></i>
            Mostrando <strong id="total-propiedades-mostradas">0</strong> propiedades
        </div>
        <div class="inv-leyenda">
            <span style="font-weight:600;margin-right:8px;">Estado:</span>
            <span class="inv-badge" style="background:#27ae60;">Verde</span>
            <span class="inv-badge" style="background:#f39c12;">Amarillo</span>
            <span class="inv-badge" style="background:#e74c3c;">Rojo</span>
        </div>
    </div>

    <!-- Tabla dinámica -->
    <div id="inventario-container">
        <div class="text-center" style="padding:80px 20px;">
            <div class="spinner-large"></div>
            <h4 style="color:#1A1A1A;font-weight:600;margin-top:20px;">Cargando inventario...</h4>
            <p style="color:#666;">Obteniendo datos del servidor</p>
        </div>
    </div>

</div>

<style>
/* ── Contenedor ─────────────────────────────────────────── */
.inv-inventario-container {
    padding: 28px;
    background: #F5F5F5;
    min-height: 100vh;
}

/* ── Header ─────────────────────────────────────────────── */
.inv-page-header {
    display: flex;
    align-items: center;
    gap: 18px;
    background: #fff;
    border-radius: 12px;
    padding: 24px 28px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    border: 1px solid #E6E6E6;
}
.inv-header-icon {
    width: 56px; height: 56px;
    background: #B8A279;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 26px; flex-shrink: 0;
}
.inv-page-title { font-size: 28px; font-weight: 700; color: #1A1A1A; margin: 0 0 4px; }
.inv-page-sub   { color: #666; font-size: 15px; margin: 0; }

/* ── Card filtros ───────────────────────────────────────── */
.inv-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    border: 1px solid #E6E6E6;
}
.inv-card-header {
    padding: 16px 24px;
    border-bottom: 1px solid #E6E6E6;
    font-size: 16px;
    color: #1A1A1A;
}
.inv-card-body { padding: 20px 24px; }

.inv-filtros-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 18px;
}
.filter-group label {
    display: block; margin-bottom: 6px;
    font-weight: 600; font-size: 13px; color: #363438;
}
.inv-select {
    width: 100%; padding: 9px 13px;
    border: 2px solid #E6E6E6; border-radius: 8px;
    font-size: 13px; transition: border-color .2s;
}
.inv-select:focus { border-color: #B8A279; outline: none; }

.inv-filtro-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.inv-btn {
    padding: 10px 20px; border-radius: 8px; border: none;
    font-weight: 600; font-size: 13px; cursor: pointer;
    transition: all .2s; display: inline-flex; align-items: center; gap: 7px;
}
.inv-btn-primary  { background: #B8A279; color: #fff; }
.inv-btn-primary:hover  { background: #9D8B5F; }
.inv-btn-secondary { background: #fff; color: #666; border: 2px solid #E6E6E6; }
.inv-btn-secondary:hover { background: #B8A279; color: #fff; border-color: #B8A279; }

/* ── Meta row ───────────────────────────────────────────── */
.inv-meta-row {
    display: flex; align-items: center;
    justify-content: space-between; flex-wrap: wrap; gap: 10px;
    margin-bottom: 16px;
}
.inv-contador {
    background: #fff; padding: 12px 18px;
    border-radius: 8px; border: 1px solid #E6E6E6;
    border-left: 4px solid #B8A279;
    font-size: 14px; color: #363438;
}
.inv-contador strong { color: #B8A279; font-size: 16px; }
.inv-leyenda {
    background: #fff; padding: 10px 16px;
    border-radius: 8px; border: 1px solid #E6E6E6;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    font-size: 13px;
}
.inv-badge {
    color: #fff; padding: 4px 10px;
    border-radius: 4px; font-size: 11px; font-weight: 600;
}

/* ── Tabla ──────────────────────────────────────────────── */
.tabla-wrapper {
    background: #fff;
    border-radius: 12px;
    overflow-x: auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin-bottom: 0;
}
.tabla-propiedades {
    width: 100%; border-collapse: collapse;
    table-layout: fixed;
}
.tabla-propiedades thead {
    background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%);
    color: #fff;
}
.tabla-propiedades th {
    padding: 14px 12px; font-size: 12px;
    font-weight: 700; text-align: left; white-space: nowrap;
}
.tabla-propiedades tbody tr {
    border-bottom: 1px solid #F0F0F0;
    cursor: pointer; transition: background .15s;
}
.tabla-propiedades tbody tr:hover { background: rgba(184,162,121,0.06); }
.tabla-propiedades td {
    padding: 11px 12px; font-size: 13px; color: #363438;
    vertical-align: middle;
}
.td-ellipsis {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.badge-estado {
    color: #fff; padding: 3px 8px;
    border-radius: 4px; font-size: 11px; font-weight: 600;
    white-space: nowrap;
}
.btn-ver {
    background: #B8A279; color: #fff;
    border: none; border-radius: 6px;
    padding: 5px 10px; cursor: pointer;
    font-size: 12px; transition: background .2s;
}
.btn-ver:hover { background: #9D8B5F; }

/* ── Paginación ─────────────────────────────────────────── */
.paginacion-container {
    display: flex; align-items: center;
    justify-content: space-between; flex-wrap: wrap; gap: 12px;
    padding: 14px 20px;
    background: #fff;
    border-top: 1px solid #E6E6E6;
    border-radius: 0 0 12px 12px;
}
.paginacion-info { font-size: 13px; color: #666; }
.paginacion-controles { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }

.pag-btn {
    min-width: 36px; height: 36px;
    padding: 0 10px;
    border: 1px solid #E6E6E6;
    border-radius: 6px;
    background: #fff; color: #363438;
    font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all .15s;
    display: inline-flex; align-items: center; justify-content: center;
}
.pag-btn:hover:not(.disabled):not(.pag-activo) {
    background: #f5f0e8; border-color: #B8A279; color: #B8A279;
}
.pag-activo {
    background: #B8A279 !important; color: #fff !important;
    border-color: #B8A279 !important; font-weight: 700;
}
.pag-btn.disabled { opacity: .4; cursor: not-allowed; }
.pag-nav { color: #B8A279; }
.pag-ellipsis {
    min-width: 36px; height: 36px;
    display: inline-flex; align-items: center; justify-content: center;
    color: #999; font-size: 14px; pointer-events: none;
}

/* ── No data ─────────────────────────────────────────────── */
.no-data-card {
    background: #fff; border-radius: 12px;
    padding: 60px 40px; text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.no-data-icon  { font-size: 64px; color: #B8A279; margin-bottom: 16px; }
.no-data-title { font-size: 22px; font-weight: 700; color: #1A1A1A; margin-bottom: 8px; }
.no-data-text  { color: #666; font-size: 15px; }

/* ── Spinner ─────────────────────────────────────────────── */
.spinner-large {
    width: 56px; height: 56px;
    border: 4px solid #E6E6E6;
    border-top-color: #B8A279;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 768px) {
    .inv-inventario-container { padding: 14px; }
    .inv-filtros-grid { grid-template-columns: 1fr; }
    .inv-meta-row { flex-direction: column; align-items: flex-start; }
    .inv-page-title { font-size: 22px; }
    .paginacion-container { flex-direction: column; align-items: flex-start; }
}
</style>
