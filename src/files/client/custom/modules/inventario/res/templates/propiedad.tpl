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
                            <p class="page-subtitle" id="propiedad-nombre">
                                <!-- Se quita el nombre de la propiedad del subtítulo -->
                            </p>
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

    <!-- Contenido del formulario (oculto inicialmente) -->
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
                
                <!-- Contenedor para recaudos dinámicos -->
                <div id="contenedor-recaudos-legal">
                    <div class="text-center" style="padding: 20px;">
                        <div class="spinner-small"></div>
                        <p>Cargando requisitos legales...</p>
                    </div>
                </div>
                
                <!-- Panel para agregar nuevos requisitos -->
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
                            <select id="buyerPersona" class="form-control">
                                <option value="Comprador">Comprador</option>
                                <option value="Vendedor">Vendedor</option>
                                <option value="Arrendador">Arrendador</option>
                                <option value="Arrendatario">Arrendatario</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- CORREGIDO: Row para SubBuyers -->
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
                
                <!-- Contenedor para recaudos de mercadeo -->
                <div id="contenedor-recaudos-mercadeo">
                    <div class="text-center" style="padding: 20px;">
                        <div class="spinner-small"></div>
                        <p>Cargando elementos de mercadeo...</p>
                    </div>
                </div>
                
                <!-- Panel para agregar nuevos elementos de mercadeo -->
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

        <!-- Panel 4: Apoderado -->
        <div class="panel">
            <div class="panel-heading" data-action="toggle-panel">
                <h4 class="panel-title">
                    <i class="fas fa-user-check"></i> Apoderado
                    <span class="nota-percentaje" style="float: right; margin-left: 10px; font-weight: bold; color: #666;">
                        <span id="nota-apoderado"></span>
                    </span>
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
                
                <!-- Contenedor para recaudos de apoderado (visible solo si es Sí) -->
                <div id="contenedor-recaudos-apoderado" style="display: none; margin-top: 20px;">
                    <div class="text-center" style="padding: 20px;">
                        <div class="spinner-small"></div>
                        <p>Cargando requisitos de apoderado...</p>
                    </div>
                </div>
                
                <!-- Panel para agregar nuevos requisitos de apoderado -->
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

        <!-- Panel 5: Otros -->
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

<!-- Modal para crear nuevo recaudo -->
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
