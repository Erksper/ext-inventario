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
                            <div class="info-label">Sub Tipo</div>
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
                    <div class="col-md-6">
                        <div class="info-item">
                            <div class="info-label">Asesor</div>
                            <div class="info-value" id="prop-asesor">-</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="info-item">
                            <div class="info-label">Fecha Alta</div>
                            <div class="info-value" id="prop-fechaAlta">-</div>
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
            </div>
        </div>

        <!-- Panel 2: Requisitos legales del inmueble -->
        <div class="panel">
            <div class="panel-heading" data-action="toggle-panel">
                <h4 class="panel-title">
                    <i class="fas fa-gavel"></i> Requisitos legales del inmueble
                    <!-- Icono de porcentaje para notas -->
                    <span class="nota-percentaje" style="float: right; margin-left: 10px; font-weight: bold; color: #666;">
                        <i class="fas fa-percentage"></i> <span id="nota-legal">0%</span>
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
                        <div class="panel-heading">
                            <h5 class="panel-title">
                                <i class="fas fa-plus-circle"></i> Agregar nuevo requisito
                            </h5>
                        </div>
                        <div class="panel-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <select id="select-agregar-legal" class="form-control">
                                        <option value="">Seleccione un requisito para agregar</option>
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
                    <!-- Icono de porcentaje para notas -->
                    <span class="nota-percentaje" style="float: right; margin-left: 10px; font-weight: bold; color: #666;">
                        <i class="fas fa-percentage"></i> <span id="nota-mercadeo">0%</span>
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
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Sub Buyer Persona</label>
                            <select id="subBuyerPersona" class="form-control">
                                <option value="">Cargando...</option>
                            </select>
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
                        <div class="panel-heading">
                            <h5 class="panel-title">
                                <i class="fas fa-plus-circle"></i> Agregar nuevo elemento de mercadeo
                            </h5>
                        </div>
                        <div class="panel-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <select id="select-agregar-mercadeo" class="form-control">
                                        <option value="">Seleccione un elemento para agregar</option>
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
                    <!-- Icono de porcentaje para notas -->
                    <span class="nota-percentaje" style="float: right; margin-left: 10px; font-weight: bold; color: #666;">
                        <i class="fas fa-percentage"></i> <span id="nota-apoderado">0%</span>
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
                                    <input type="radio" name="apoderado" value="true"> Sí
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="apoderado" value="false" checked> No
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
                        <div class="panel-heading">
                            <h5 class="panel-title">
                                <i class="fas fa-plus-circle"></i> Agregar nuevo requisito de apoderado
                            </h5>
                        </div>
                        <div class="panel-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <select id="select-agregar-apoderado" class="form-control">
                                        <option value="">Seleccione un requisito para agregar</option>
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
                    <!-- Badge con el estado seleccionado -->
                    <span class="panel-status-badge" id="status-otros" style="float: right; margin-left: 10px; font-weight: bold;">
                        <span class="status-text">Pendiente</span>
                    </span>
                    <span class="fas fa-chevron-down"></span>
                </h4>
            </div>
            <div class="panel-body" style="display: none;">
                <!-- Tabla de semáforo para los 4 campos -->
                <div class="table-responsive">
                    <table class="table table-bordered semaforo-table">
                        <thead>
                            <tr>
                                <th>Campo</th>
                                <th><i class="fas fa-circle icon-verde"></i> Adecuado</th>
                                <th><i class="fas fa-circle icon-amarillo"></i> Revisar</th>
                                <th><i class="fas fa-circle icon-rojo"></i> Modificar</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="campo-row">
                                <td>
                                    <div class="campo-texto-container">
                                        <h4>Exclusividad</h4>
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-verde"
                                        data-action="selectSemaforo" 
                                        data-campo="exclusividad" 
                                        data-valor="Exclusividad pura o total con contrato firmado">
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-amarillo"
                                        data-action="selectSemaforo" 
                                        data-campo="exclusividad" 
                                        data-valor="Exclusividad interna de CENTURY con contrato firmado">
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-rojo"
                                        data-action="selectSemaforo" 
                                        data-campo="exclusividad" 
                                        data-valor="No exclusividad">
                                    </div>
                                </td>
                                <td class="estado-campo" id="estado-exclusividad">
                                    <span class="badge estado-badge estado-pendiente">Pendiente</span>
                                </td>
                            </tr>
                            <tr class="campo-row">
                                <td>
                                    <div class="campo-texto-container">
                                        <h4>Precio</h4>
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-verde"
                                        data-action="selectSemaforo" 
                                        data-campo="precio" 
                                        data-valor="En rango">
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-amarillo"
                                        data-action="selectSemaforo" 
                                        data-campo="precio" 
                                        data-valor="Sobre el rango">
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-rojo"
                                        data-action="selectSemaforo" 
                                        data-campo="precio" 
                                        data-valor="Debajo del rango">
                                    </div>
                                </td>
                                <td class="estado-campo" id="estado-precio">
                                    <span class="badge estado-badge estado-pendiente">Pendiente</span>
                                </td>
                            </tr>
                            <tr class="campo-row">
                                <td>
                                    <div class="campo-texto-container">
                                        <h4>Ubicación</h4>
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-verde"
                                        data-action="selectSemaforo" 
                                        data-campo="ubicacion" 
                                        data-valor="Adecuado">
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-amarillo"
                                        data-action="selectSemaforo" 
                                        data-campo="ubicacion" 
                                        data-valor="Revisar">
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-rojo"
                                        data-action="selectSemaforo" 
                                        data-campo="ubicacion" 
                                        data-valor="Modificar">
                                    </div>
                                </td>
                                <td class="estado-campo" id="estado-ubicacion">
                                    <span class="badge estado-badge estado-pendiente">Pendiente</span>
                                </td>
                            </tr>
                            <tr class="campo-row">
                                <td>
                                    <div class="campo-texto-container">
                                        <h4>Demanda</h4>
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-verde"
                                        data-action="selectSemaforo" 
                                        data-campo="demanda" 
                                        data-valor="Alta demanda">
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-amarillo"
                                        data-action="selectSemaforo" 
                                        data-campo="demanda" 
                                        data-valor="Media demanda">
                                    </div>
                                </td>
                                <td>
                                    <div class="color-option color-rojo"
                                        data-action="selectSemaforo" 
                                        data-campo="demanda" 
                                        data-valor="Baja demanda">
                                    </div>
                                </td>
                                <td class="estado-campo" id="estado-demanda">
                                    <span class="badge estado-badge estado-pendiente">Pendiente</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Inputs hidden para los valores de semáforo -->
                <input type="hidden" id="exclusividad" value="No exclusividad">
                <input type="hidden" id="precio" value="En rango">
                <input type="hidden" id="ubicacion" value="Modificar">
                <input type="hidden" id="demanda" value="Media demanda">
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

<style>
/* Variables de colores */
:root {
    --color-primary: #B8A279;
    --color-success: #27ae60;
    --color-warning: #f39c12;
    --color-danger: #e74c3c;
    --color-gray: #95a5a6;
    --color-dark: #1A1A1A;
    --color-light: #F5F5F5;
}

/* Container */
.inv-propiedad-container {
    padding: 30px;
    background-color: var(--color-light);
    min-height: 100vh;
}

/* Header */
.page-header-card {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 1px solid #E6E6E6;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
}

.header-icon {
    width: 60px;
    height: 60px;
    background: var(--color-primary);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 28px;
}

.page-title {
    color: var(--color-dark);
    font-weight: 700;
    font-size: 32px;
    margin: 0 0 8px 0;
}

.page-subtitle {
    color: #666666;
    font-size: 16px;
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 10px;
}

/* Paneles */
.panel {
    background: #FFFFFF;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid #E6E6E6;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

.panel-heading {
    background-color: #f8f9fa;
    border-bottom: 1px solid #E6E6E6;
    padding: 15px 20px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    border-radius: 8px 8px 0 0;
    position: relative;
}

.panel-heading:hover {
    background-color: #e9ecef;
}

.panel-title {
    color: #363438;
    font-weight: 600;
    font-size: 16px;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.panel-title .fas {
    color: var(--color-primary);
}

.nota-percentaje {
    font-size: 14px;
    color: var(--color-primary);
    font-weight: 600;
}

.panel-body {
    padding: 20px;
}

/* Info items */
.info-item {
    margin-bottom: 15px;
}

.info-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 2px;
    font-weight: 600;
}

.info-value {
    font-size: 14px;
    font-weight: 500;
}

/* Form controls */
.form-group {
    margin-bottom: 15px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #363438;
    font-size: 14px;
}

.form-control {
    width: 100%;
    border: 2px solid #E6E6E6;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    transition: all 0.3s ease;
}

.form-control:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(184, 162, 121, 0.1);
}

/* Selects con semáforo */
.select-semaforo {
    font-weight: bold;
}

.select-semaforo option[value="Modificar"] {
    background-color: var(--color-danger);
    color: white;
}

.select-semaforo option[value="Revisar"] {
    background-color: var(--color-warning);
    color: white;
}

.select-semaforo option[value="Adecuado"] {
    background-color: var(--color-success);
    color: white;
}

.select-semaforo-precio option[value="Debajo del rango"] {
    background-color: var(--color-danger);
    color: white;
}

.select-semaforo-precio option[value="En rango"] {
    background-color: var(--color-success);
    color: white;
}

.select-semaforo-precio option[value="Sobre el rango"] {
    background-color: var(--color-warning);
    color: white;
}

/* Radio buttons */
.radio-group {
    display: flex;
    gap: 20px;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
}

.radio-label input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

/* Badges */
.badge {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
}

/* Botones */
.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 30px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid #E6E6E6;
}

.btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: var(--color-primary);
    color: white;
}

.btn-primary:hover {
    background: #9D8B5F;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(184, 162, 121, 0.3);
}

.btn-default {
    background: white;
    color: #666;
    border: 2px solid #E6E6E6;
}

.btn-default:hover {
    background: #f8f9fa;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #5a6268;
}

/* Spinners */
.spinner-large {
    width: 60px;
    height: 60px;
    border: 4px solid #E6E6E6;
    border-top: 4px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

.spinner-small {
    width: 30px;
    height: 30px;
    border: 3px solid #E6E6E6;
    border-top: 3px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Alert */
.alert {
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 15px;
}

.alert-info {
    background-color: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
}

.alert-danger {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
}

/* Tablas de semáforo */
.semaforo-table {
    margin-top: 20px;
    border: 2px solid #000;
}

.semaforo-table thead tr {
    background: #f5f5f5;
}

.semaforo-table thead th {
    border: 1px solid #000;
    color: black;
    text-align: center;
    font-size: 14px;
    width: 20%;
}

.semaforo-table thead th:first-child {
    width: 40%;
    text-align: left;
}

.semaforo-table thead th .fa-circle {
    margin-right: 5px;
}

.semaforo-table thead th .icon-verde {
    color: #27ae60;
}

.semaforo-table thead th .icon-amarillo {
    color: #f39c12;
}

.semaforo-table thead th .icon-rojo {
    color: #e74c3c;
}

.semaforo-table tbody td {
    border: 1px solid #000;
    padding: 15px;
    text-align: center;
    vertical-align: middle;
}

.semaforo-table tbody .campo-row td:first-child {
    padding: 15px;
    font-weight: 500;
    text-align: left;
}

.campo-texto-container {
    display: flex;
    align-items: center;
}

.campo-texto-container h4 {
    font-size: 15px;
    margin: 0;
    color: #363438;
}

/* Estilos para recaudos */
.recaudos-table {
    margin-top: 20px;
    border: 2px solid #000;
}

.recaudos-table thead tr {
    background: #f5f5f5;
}

.recaudos-table thead th {
    border: 1px solid #000;
    color: black;
    text-align: center;
    font-size: 14px;
    width: 20%;
}

.recaudos-table thead th:first-child {
    width: 40%;
    text-align: left;
}

.recaudo-texto-container {
    display: flex;
    align-items: flex-start;
}

.recaudo-icon-space {
    display: inline-block;
    width: 25px;
    flex-shrink: 0;
    text-align: left;
}

.recaudo-row h4 {
    font-size: 14px;
    margin: 0;
    flex: 1;
    font-weight: 500;
}

.info-icon {
    color: #17a2b8;
    font-size: 16px;
    cursor: pointer;
    margin-right: 5px;
    transition: color 0.2s ease, transform 0.2s ease;
}

.info-icon:hover {
    color: #138496;
    transform: scale(1.1);
}

/* Opciones de color tipo semáforo */
.color-option {
    position: relative;
    width: 30px;
    height: 30px;
    margin: 0 auto;
    border-radius: 6px;
    border: 2px solid #ddd;
    cursor: pointer;
    background-color: #f8f9fa; /* Color de fondo por defecto */
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.color-option:hover {
    opacity: 0.9;
    transform: scale(1.05);
}

.color-option.selected {
    border-color: #000 !important;
    border-width: 3px !important;
    transform: scale(1.15);
    box-shadow: 0 0 0 1px #fff, 0 0 0 3px #000;
    animation: pulse 0.4s ease-in-out;
}

/* Colores base para las opciones (deben tener color de fondo) */
.color-verde {
    background-color: #27ae60 !important;
    border-color: #27ae60;
}

.color-amarillo {
    background-color: #f39c12 !important;
    border-color: #f39c12;
}

.color-rojo {
    background-color: #e74c3c !important;
    border-color: #e74c3c;
}

.color-option.selected::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 16px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

@keyframes pulse {
    0% { transform: scale(1.15); }
    50% { transform: scale(1.25); }
    100% { transform: scale(1.15); }
}

/* Responsive */
@media (max-width: 768px) {
    .inv-propiedad-container {
        padding: 15px;
    }
    
    .page-title {
        font-size: 24px;
    }
    
    .header-left {
        flex-direction: column;
        text-align: center;
    }
    
    .form-actions {
        flex-direction: column;
    }
    
    .btn {
        width: 100%;
        justify-content: center;
    }
    
    .nota-percentaje {
        position: absolute;
        right: 50px;
        top: 50%;
        transform: translateY(-50%);
    }
    
    .semaforo-table thead th,
    .recaudos-table thead th {
        font-size: 12px;
        padding: 8px 4px;
    }
    
    .semaforo-table tbody td,
    .recaudos-table tbody td {
        padding: 10px 4px;
    }
    
    .campo-texto-container h4 {
        font-size: 13px;
    }
    
    .recaudo-row h4 {
        font-size: 12px;
    }
    
    .color-option {
        width: 25px;
        height: 25px;
    }
}

@media (max-width: 480px) {
    .panel-heading {
        padding: 10px 15px;
    }
    
    .panel-title {
        font-size: 14px;
    }
    
    .info-label {
        font-size: 11px;
    }
    
    .info-value {
        font-size: 12px;
    }
}

/* Badges de estado para panel "Otros" */
.panel-status-badge {
    padding: 5px 12px;
    border-radius: 4px;
    font-size: 13px;
    color: white;
}

.panel-status-badge .status-text {
    font-weight: bold;
}

.estado-campo {
    text-align: center;
    vertical-align: middle;
}

.estado-badge {
    padding: 4px 10px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    min-width: 70px;
    display: inline-block;
}

.estado-pendiente {
    background-color: #95a5a6;
    color: white;
}

.estado-modificar {
    background-color: #e74c3c;
    color: white;
}

.estado-revisar {
    background-color: #f39c12;
    color: white;
}

.estado-adecuado {
    background-color: #27ae60;
    color: white;
}

/* Botón para eliminar recaudos */
.btn-eliminar-recaudo {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    font-size: 16px;
    padding: 5px;
    transition: all 0.2s ease;
}

.btn-eliminar-recaudo:hover {
    color: #c0392b;
    transform: scale(1.2);
}

/* Panel para agregar recaudos */
.agregar-recaudo-panel .panel-default {
    border: 1px solid #ddd;
    border-radius: 6px;
}

.agregar-recaudo-panel .panel-heading {
    background-color: #f8f9fa;
    padding: 10px 15px;
    border-bottom: 1px solid #ddd;
}

.agregar-recaudo-panel .panel-title {
    font-size: 14px;
    color: #495057;
    margin: 0;
}

.agregar-recaudo-panel .panel-body {
    padding: 15px;
}

.btn-agregar-recaudo {
    width: 100%;
}

/* Columna para botón eliminar en recaudos */
.recaudos-table td:last-child {
    width: 50px;
    text-align: center;
}
</style>