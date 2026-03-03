<link rel="stylesheet" type="text/css" href="client/custom/modules/inventario/res/css/inv-propiedades.css">
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
                    <label>Estatus</label>
                    <select id="filtro-estatus" class="form-control inv-select">
                        <option value="">Todos los estatus</option>
                        <option value="Verde">Verde</option>
                        <option value="Amarillo">Amarillo</option>
                        <option value="Rojo">Rojo</option>
                        <option value="Sin calcular">Sin Calcular</option>
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
        <div class="inv-spinner-wrap">
            <div class="spinner-large"></div>
            <h4 class="inv-spinner-title">Cargando inventario...</h4>
            <p class="inv-spinner-sub">Obteniendo datos del servidor</p>
        </div>
    </div>

</div>