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
