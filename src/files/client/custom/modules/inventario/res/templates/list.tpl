<div class="container-fluid inv-inventario-container">
    <!-- Header principal -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="page-header-card">
                <div class="d-flex justify-content-between align-items-start flex-wrap">
                    <div class="header-left" style="flex: 1;">
                        <div class="header-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="header-content">
                            <h1 class="page-title">Inventario de Propiedades</h1>
                            <p class="page-subtitle">
                                Gestión y visualización del inventario inmobiliario
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Filtros -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="filtro-card">
                <div class="filtro-header">
                    <div class="filtro-title-wrapper">
                        <i class="fas fa-filter filtro-title-icon"></i>
                        <h3 class="filtro-title">Filtrar Propiedades</h3>
                    </div>
                </div>
                <div class="filtro-body">
                    <div class="filtros-grid">
                        <div class="filter-group" id="filtro-cla-group">
                            <label for="filtro-cla">CLA</label>
                            <select id="filtro-cla" class="form-control">
                                <option value="">Todos los CLAs</option>
                            </select>
                        </div>
                        <div class="filter-group" id="filtro-oficina-group">
                            <label for="filtro-oficina">Oficina</label>
                            <select id="filtro-oficina" class="form-control" disabled>
                                <option value="">Seleccione un CLA primero</option>
                            </select>
                        </div>
                        <div class="filter-group" id="filtro-asesor-group">
                            <label for="filtro-asesor">Asesor</label>
                            <select id="filtro-asesor" class="form-control" disabled>
                                <option value="">Seleccione una oficina primero</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filtro-estado">Estado (Propiedad)</label>
                            <select id="filtro-estado" class="form-control">
                                <option value="">Todos</option>
                                <option value="Disponible">Disponible</option>
                                <option value="Reservada">Reservada</option>
                                <option value="Vendida">Vendida</option>
                                <option value="Rentada">Rentada</option>
                                <option value="Retirada">Retirada</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filtro-municipio">Municipio</label>
                            <input type="text" id="filtro-municipio" class="form-control" placeholder="Ej: Chacao">
                        </div>
                        <div class="filter-group">
                            <label for="filtro-ciudad">Ciudad</label>
                            <input type="text" id="filtro-ciudad" class="form-control" placeholder="Ej: Caracas">
                        </div>
                        <div class="filter-group">
                            <label for="filtro-fecha-desde">Desde</label>
                            <input type="date" id="filtro-fecha-desde" class="form-control">
                        </div>
                        <div class="filter-group">
                            <label for="filtro-fecha-hasta">Hasta</label>
                            <input type="date" id="filtro-fecha-hasta" class="form-control">
                        </div>
                    </div>
                    <div class="filtro-actions">
                        <button class="btn btn-action btn-aplicar" data-action="aplicar-filtros">
                            <i class="fas fa-search"></i>
                            <span>Buscar</span>
                        </button>
                        <button class="btn btn-action btn-limpiar" data-action="limpiar-filtros">
                            <i class="fas fa-times"></i>
                            <span>Limpiar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Contador de propiedades -->
    <div class="row mb-3">
        <div class="col-md-12">
            <div class="contador-propiedades">
                <i class="fas fa-home me-2"></i>
                <strong id="total-propiedades-mostradas">0</strong> propiedades encontradas
            </div>
        </div>
    </div>
    
    <!-- Leyenda de semáforo -->
    <div class="row mb-3">
        <div class="col-md-12">
            <div class="leyenda-semaforo">
                <span class="leyenda-titulo">
                    <i class="fas fa-traffic-light me-2"></i>
                    <strong>Estado de Propiedad:</strong>
                </span>
                <div class="leyenda-items">
                    <span class="leyenda-badge" style="background: #27ae60;" title="Propiedad en óptimas condiciones">Verde (Óptima)</span>
                    <span class="leyenda-badge" style="background: #f39c12;" title="Propiedad requiere atención">Amarillo (Atención)</span>
                    <span class="leyenda-badge" style="background: #e74c3c;" title="Propiedad requiere acción urgente">Rojo (Urgente)</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Contenido dinámico - Lista de propiedades -->
    <div id="inventario-container">
        <div class="text-center" style="padding: 80px 20px;">
            <div class="spinner-large"></div>
            <h4 class="mt-4" style="color: #1A1A1A; font-weight: 600; margin-bottom: 10px;">
                Cargando inventario...
            </h4>
            <p style="color: #666666;">
                Obteniendo datos del servidor
            </p>
        </div>
    </div>
</div>

<style>
/* Estilos base */
.inv-inventario-container {
    padding: 30px;
    background-color: #F5F5F5;
    min-height: 100vh;
}

/* Header */
.page-header-card,
.filtro-card {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 1px solid #E6E6E6;
    margin-bottom: 30px;
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
    background: #B8A279;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 28px;
}

.page-title {
    color: #1A1A1A;
    font-weight: 700;
    font-size: 32px;
    margin: 0 0 8px 0;
}

.page-subtitle {
    color: #666666;
    font-size: 16px;
    margin: 0;
}

/* Filtros */
.filtro-header {
    margin-bottom: 25px;
}

.filtro-title-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
}

.filtro-title-icon {
    color: #B8A279;
    font-size: 20px;
}

.filtro-title {
    color: #1A1A1A;
    font-weight: 600;
    font-size: 20px;
    margin: 0;
}

.filtro-body {
    padding-top: 20px;
    border-top: 1px solid #E6E6E6;
}

.filtros-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.filter-group {
    display: block;
}

.filter-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #363438;
    font-size: 14px;
}

.filter-group .form-control {
    width: 100%;
    padding: 10px 15px;
    border: 2px solid #E6E6E6;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
}

.filter-group .form-control:focus {
    border-color: #B8A279;
    outline: none;
    box-shadow: 0 0 0 3px rgba(184, 162, 121, 0.1);
}

.filtro-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.btn-action {
    border-radius: 8px;
    padding: 12px 20px;
    font-weight: 600;
    font-size: 14px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-aplicar {
    background: #B8A279;
    color: white;
}

.btn-aplicar:hover {
    background: #9D8B5F;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(184, 162, 121, 0.2);
}

.btn-limpiar {
    background: #FFFFFF;
    color: #666666;
    border: 2px solid #E6E6E6;
}

.btn-limpiar:hover {
    background: #B8A279;
    color: white;
    border-color: #B8A279;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(184, 162, 121, 0.2);
}

/* Contador de propiedades */
.contador-propiedades {
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    border: 1px solid #E6E6E6;
    border-left: 4px solid #B8A279;
    color: #363438;
    font-size: 15px;
    display: flex;
    align-items: center;
}

.contador-propiedades strong {
    color: #B8A279;
    font-size: 18px;
    margin: 0 5px;
}

/* Leyenda de semáforo */
.leyenda-semaforo {
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    border: 1px solid #E6E6E6;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
}

.leyenda-titulo {
    color: #363438;
    font-size: 14px;
}

.leyenda-items {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.leyenda-badge {
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: help;
    transition: transform 0.2s ease;
}

.leyenda-badge:hover {
    transform: scale(1.05);
}

/* Tabla de propiedades */
.tabla-propiedades {
    background: white;
    border-radius: 12px;
    overflow-x: auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.tabla-propiedades table {
    width: 100%;
    min-width: 1200px;
    border-collapse: collapse;
}

.tabla-propiedades thead {
    background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%);
    color: white;
}

.tabla-propiedades th {
    padding: 18px 15px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
}

.tabla-propiedades tbody tr {
    border-bottom: 1px solid #E6E6E6;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tabla-propiedades tbody tr:hover {
    background: rgba(184, 162, 121, 0.05);
}

.tabla-propiedades td {
    padding: 15px;
    font-size: 14px;
    color: #363438;
}

/* Semáforo */
.semaforo-indicator {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: inline-block;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.semaforo-verde {
    background: #27ae60;
}

.semaforo-amarillo {
    background: #f39c12;
}

.semaforo-rojo {
    background: #e74c3c;
}

.btn-view {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

/* Spinner */
.spinner-large {
    width: 60px;
    height: 60px;
    border: 4px solid #E6E6E6;
    border-top: 4px solid #B8A279;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* No data card */
.no-data-card {
    background: white;
    border-radius: 12px;
    padding: 60px 40px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.no-data-icon {
    font-size: 64px;
    color: #B8A279;
    margin-bottom: 20px;
}

.no-data-title {
    color: #1A1A1A;
    font-weight: 700;
    font-size: 24px;
    margin-bottom: 10px;
}

.no-data-text {
    color: #666666;
    font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
    .inv-inventario-container {
        padding: 15px;
    }
    
    .filtros-grid {
        grid-template-columns: 1fr;
    }
    
    .header-left {
        flex-direction: column;
        text-align: center;
    }
    
    .page-title {
        font-size: 24px;
    }
    
    .tabla-propiedades {
        overflow-x: auto;
    }
    
    .filtro-actions {
        flex-direction: column;
    }
    
    .btn-action {
        width: 100%;
    }
}
</style>
