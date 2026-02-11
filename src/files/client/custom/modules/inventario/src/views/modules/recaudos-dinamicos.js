define('inventario:views/modules/recaudos-dinamicos', [], function () {
    
    var RecaudosDinamicosManager = function (view) {
        this.view = view;
        this.recaudosPorDefectoCache = {};
        this.recaudosNoPorDefectoCache = {};
        this.recaudosAgregados = {
            legal: [],
            mercadeo: [],
            apoderado: []
        };
    };

    RecaudosDinamicosManager.prototype.cargarRecaudosPorTipo = function (tipo, esPorDefecto) {
        var self = this;
        var cacheKey = tipo + (esPorDefecto ? '_default' : '_nodefault');
        
        // Si ya tenemos los recaudos en cache, devolverlos
        if (esPorDefecto && this.recaudosPorDefectoCache[cacheKey]) {
            return Promise.resolve(this.recaudosPorDefectoCache[cacheKey]);
        }
        if (!esPorDefecto && this.recaudosNoPorDefectoCache[cacheKey]) {
            return Promise.resolve(this.recaudosNoPorDefectoCache[cacheKey]);
        }
        
        return new Promise(function (resolve, reject) {
            // Para tipos array (legal), convertir a JSON string
            var tipoParam = Array.isArray(tipo) ? JSON.stringify(tipo) : tipo;
            
            Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosByTipo', { 
                tipo: tipoParam,
                default: esPorDefecto
            })
                .then(function (response) {
                    if (response.success && response.data) {
                        if (esPorDefecto) {
                            self.recaudosPorDefectoCache[cacheKey] = response.data;
                        } else {
                            self.recaudosNoPorDefectoCache[cacheKey] = response.data;
                        }
                        resolve(response.data);
                    } else {
                        reject('No se pudieron cargar los recaudos');
                    }
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos:', error);
                    reject(error);
                });
        });
    };

    RecaudosDinamicosManager.prototype.crearHTMLRecaudos = function (recaudos, campoId, sonPorDefecto) {
        var html = '';
        
        if (!recaudos || recaudos.length === 0) {
            return sonPorDefecto ? 
                '<div class="alert alert-info">No hay recaudos por defecto disponibles</div>' :
                '<div class="alert alert-info">No hay recaudos adicionales disponibles</div>';
        }
        
        html += '<div class="recaudos-container">';
        html += '<table class="table table-bordered recaudos-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>Recaudo</th>';
        html += '<th><i class="fas fa-circle icon-verde"></i> Adecuado</th>';
        html += '<th><i class="fas fa-circle icon-amarillo"></i> Revisar</th>';
        html += '<th><i class="fas fa-circle icon-rojo"></i> Modificar</th>';
        html += '<th>Acción</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        recaudos.forEach(function (recaudo) {
            html += '<tr class="recaudo-row" data-recaudo-id="' + recaudo.id + '" data-es-por-defecto="' + (recaudo.default || false) + '">';
            html += '<td>';
            html += '<div class="recaudo-texto-container">';
            
            // Icono de información si hay descripción
            if (recaudo.descripcion && recaudo.descripcion.trim() !== '') {
                html += '<span class="recaudo-icon-space">';
                html += '<i class="fas fa-info-circle info-icon" ';
                html += 'data-action="showInfoRecaudo" ';
                html += 'data-toggle="tooltip" ';
                html += 'data-html="true" ';
                html += 'data-info="' + this.escapeHtml(recaudo.descripcion) + '" ';
                html += 'data-recaudo-texto="' + this.escapeHtml(recaudo.name) + '" ';
                html += 'title="<small>Click para ver información completa</small>"></i>';
                html += '</span>';
            } else {
                html += '<span class="recaudo-icon-space"></span>';
            }
            
            html += '<h4>' + this.escapeHtml(recaudo.name) + '</h4>';
            
            // Indicador si es por defecto
            if (recaudo.default) {
                html += '<span class="badge badge-default" style="margin-left: 10px; background-color: #6c757d; color: white; font-size: 10px;">Por defecto</span>';
            }
            
            html += '</div>';
            html += '</td>';
            
            // Opciones de semáforo
            html += '<td>';
            html += '<div class="color-option color-verde" ';
            html += 'data-action="selectRecaudoSemaforo" ';
            html += 'data-recaudo-id="' + recaudo.id + '" ';
            html += 'data-campo-id="' + campoId + '" ';
            html += 'data-valor="Adecuado">';
            html += '</div>';
            html += '</td>';
            
            html += '<td>';
            html += '<div class="color-option color-amarillo" ';
            html += 'data-action="selectRecaudoSemaforo" ';
            html += 'data-recaudo-id="' + recaudo.id + '" ';
            html += 'data-campo-id="' + campoId + '" ';
            html += 'data-valor="Revisar">';
            html += '</div>';
            html += '</td>';
            
            html += '<td>';
            html += '<div class="color-option color-rojo" ';
            html += 'data-action="selectRecaudoSemaforo" ';
            html += 'data-recaudo-id="' + recaudo.id + '" ';
            html += 'data-campo-id="' + campoId + '" ';
            html += 'data-valor="Modificar">';
            html += '</div>';
            html += '</td>';
            
            // Botón para eliminar (siempre visible, pero con confirmación diferente para por defecto)
            html += '<td>';
            html += '<button class="btn-eliminar-recaudo" ';
            html += 'data-action="eliminarRecaudo" ';
            html += 'data-recaudo-id="' + recaudo.id + '" ';
            html += 'data-campo-id="' + campoId + '" ';
            html += 'data-es-por-defecto="' + (recaudo.default || false) + '" ';
            html += 'title="' + (recaudo.default ? 'Eliminar recaudo por defecto' : 'Eliminar este recaudo') + '">';
            html += '<i class="fas fa-minus-circle"></i>';
            html += '</button>';
            html += '</td>';
            
            html += '</tr>';
        }.bind(this));
        
        html += '</tbody>';
        html += '</table>';
        
        // Inputs hidden para cada recaudo
        html += '<div class="recaudos-hidden-inputs">';
        recaudos.forEach(function (recaudo) {
            html += '<input type="hidden" id="recaudo_' + recaudo.id + '_' + campoId + '" value="Modificar">';
        });
        html += '</div>';
        
        html += '</div>';
        
        return html;
    };

    RecaudosDinamicosManager.prototype.cargarSelectAgregarRecaudos = function (tipo, campoId) {
        var self = this;
        
        // Cargar recaudos NO por defecto para este tipo
        this.cargarRecaudosPorTipo(tipo, false)
            .then(function (recaudos) {
                var $select = self.view.$el.find('#select-agregar-' + campoId);
                if ($select.length === 0) {
                    console.error('Select no encontrado: #select-agregar-' + campoId);
                    return;
                }
                
                $select.empty();
                $select.append('<option value="">Seleccione un elemento para agregar</option>');
                
                // Filtrar recaudos que ya están agregados
                var recaudosAgregadosIds = self.recaudosAgregados[campoId].map(function(r) { return r.id; });
                var recaudosDisponibles = recaudos.filter(function(recaudo) {
                    return !recaudosAgregadosIds.includes(recaudo.id);
                });
                
                if (recaudosDisponibles.length === 0) {
                    $select.append('<option value="" disabled>No hay elementos disponibles para agregar</option>');
                } else {
                    recaudosDisponibles.forEach(function (recaudo) {
                        $select.append('<option value="' + recaudo.id + '">' + recaudo.name + '</option>');
                    });
                }
                
                // Siempre agregar opción para crear nuevo
                $select.append('<option value="crear_nuevo">+ Crear nuevo requisito</option>');
                
                // Mostrar el panel
                self.view.$el.find('#panel-agregar-' + campoId).show();
            })
            .catch(function (error) {
                console.error('Error cargando recaudos para agregar:', error);
            });
    };

    RecaudosDinamicosManager.prototype.agregarRecaudo = function (recaudoId, campoId) {
        var self = this;
        var tipo = this.getTipoPorCampoId(campoId);
        
        // Buscar el recaudo en los cache
        var cacheKey = Array.isArray(tipo) ? tipo.join('_') + '_nodefault' : tipo + '_nodefault';
        var recaudos = this.recaudosNoPorDefectoCache[cacheKey] || [];
        var recaudo = recaudos.find(function(r) { return r.id == recaudoId; });
        
        if (!recaudo) {
            console.error('Recaudo no encontrado:', recaudoId);
            return;
        }
        
        // Agregar a la lista de recaudos agregados
        this.recaudosAgregados[campoId].push(recaudo);
        
        // Crear HTML para el nuevo recaudo
        var htmlRecaudo = this.crearHTMLRecaudoIndividual(recaudo, campoId, false);
        
        // Agregar a la tabla
        var $tabla = self.view.$el.find('#contenedor-recaudos-' + campoId + ' .recaudos-table tbody');
        if ($tabla.length === 0) {
            // Si no hay tabla, crear una nueva
            var htmlTabla = '<table class="table table-bordered recaudos-table"><tbody>' + htmlRecaudo + '</tbody></table>';
            self.view.$el.find('#contenedor-recaudos-' + campoId).html(htmlTabla);
        } else {
            $tabla.append(htmlRecaudo);
        }
        
        // Agregar input hidden
        var $hiddenInputs = self.view.$el.find('#contenedor-recaudos-' + campoId + ' .recaudos-hidden-inputs');
        if ($hiddenInputs.length === 0) {
            self.view.$el.find('#contenedor-recaudos-' + campoId).append('<div class="recaudos-hidden-inputs"></div>');
            $hiddenInputs = self.view.$el.find('#contenedor-recaudos-' + campoId + ' .recaudos-hidden-inputs');
        }
        $hiddenInputs.append('<input type="hidden" id="recaudo_' + recaudo.id + '_' + campoId + '" value="Modificar">');
        
        // Actualizar el select
        this.actualizarSelectAgregar(campoId);
        
        // Inicializar tooltips
        self.view.inicializarTooltipsRecaudos();
    };

    RecaudosDinamicosManager.prototype.eliminarRecaudo = function (recaudoId, campoId) {
        var self = this;
        
        // Encontrar el recaudo
        var recaudosAgregados = this.recaudosAgregados[campoId];
        var index = recaudosAgregados.findIndex(function(r) { return r.id == recaudoId; });
        
        if (index === -1) return;
        
        // Remover de la lista
        var recaudo = recaudosAgregados[index];
        recaudosAgregados.splice(index, 1);
        
        // Remover de la tabla
        self.view.$el.find('#contenedor-recaudos-' + campoId + ' tr[data-recaudo-id="' + recaudoId + '"]').remove();
        
        // Remover input hidden
        self.view.$el.find('#recaudo_' + recaudoId + '_' + campoId).remove();
        
        // Actualizar el select
        this.actualizarSelectAgregar(campoId);
    };

    RecaudosDinamicosManager.prototype.actualizarSelectAgregar = function (campoId) {
        var self = this;
        var tipo = this.getTipoPorCampoId(campoId);
        
        // Recargar el select
        this.cargarSelectAgregarRecaudos(tipo, campoId);
    };

    RecaudosDinamicosManager.prototype.crearHTMLRecaudoIndividual = function (recaudo, campoId, esPorDefecto) {
        var html = '';
        
        html += '<tr class="recaudo-row" data-recaudo-id="' + recaudo.id + '">';
        html += '<td>';
        html += '<div class="recaudo-texto-container">';
        
        // Icono de información si hay descripción
        if (recaudo.descripcion && recaudo.descripcion.trim() !== '') {
            html += '<span class="recaudo-icon-space">';
            html += '<i class="fas fa-info-circle info-icon" ';
            html += 'data-action="showInfoRecaudo" ';
            html += 'data-toggle="tooltip" ';
            html += 'data-html="true" ';
            html += 'data-info="' + this.escapeHtml(recaudo.descripcion) + '" ';
            html += 'data-recaudo-texto="' + this.escapeHtml(recaudo.name) + '" ';
            html += 'title="<small>Click para ver información completa</small>"></i>';
            html += '</span>';
        } else {
            html += '<span class="recaudo-icon-space"></span>';
        }
        
        html += '<h4>' + this.escapeHtml(recaudo.name) + '</h4>';
        html += '</div>';
        html += '</td>';
        
        // Opciones de semáforo
        html += '<td>';
        html += '<div class="color-option color-verde" ';
        html += 'data-action="selectRecaudoSemaforo" ';
        html += 'data-recaudo-id="' + recaudo.id + '" ';
        html += 'data-campo-id="' + campoId + '" ';
        html += 'data-valor="Adecuado">';
        html += '</div>';
        html += '</td>';
        
        html += '<td>';
        html += '<div class="color-option color-amarillo" ';
        html += 'data-action="selectRecaudoSemaforo" ';
        html += 'data-recaudo-id="' + recaudo.id + '" ';
        html += 'data-campo-id="' + campoId + '" ';
        html += 'data-valor="Revisar">';
        html += '</div>';
        html += '</td>';
        
        html += '<td>';
        html += '<div class="color-option color-rojo" ';
        html += 'data-action="selectRecaudoSemaforo" ';
        html += 'data-recaudo-id="' + recaudo.id + '" ';
        html += 'data-campo-id="' + campoId + '" ';
        html += 'data-valor="Modificar">';
        html += '</div>';
        html += '</td>';
        
        // Botón para eliminar (solo si no es por defecto)
        html += '<td>';
        if (!esPorDefecto) {
            html += '<button class="btn-eliminar-recaudo" ';
            html += 'data-action="eliminarRecaudo" ';
            html += 'data-recaudo-id="' + recaudo.id + '" ';
            html += 'data-campo-id="' + campoId + '" ';
            html += 'title="Eliminar este recaudo">';
            html += '<i class="fas fa-minus-circle"></i>';
            html += '</button>';
        } else {
            html += '&nbsp;';
        }
        html += '</td>';
        
        html += '</tr>';
        
        return html;
    };

    RecaudosDinamicosManager.prototype.agregarRecaudoDesdeCreacion = function (recaudoId, campoId) {
        var self = this;
        var tipo = this.getTipoPorCampoId(campoId);
        
        // Primero obtener los detalles del recaudo creado
        Espo.Ajax.getRequest('InvRecaudos/action/getRecaudoById', { id: recaudoId })
            .then(function (response) {
                if (response.success && response.data) {
                    var recaudo = response.data;
                    
                    // Agregar a la lista de recaudos agregados
                    self.recaudosAgregados[campoId].push(recaudo);
                    
                    // Crear HTML para el nuevo recaudo
                    var htmlRecaudo = self.crearHTMLRecaudoIndividual(recaudo, campoId, false);
                    
                    // Agregar a la tabla
                    var $tabla = self.view.$el.find('#contenedor-recaudos-' + campoId + ' .recaudos-table tbody');
                    if ($tabla.length === 0) {
                        // Si no hay tabla, crear una nueva
                        var htmlTabla = '<table class="table table-bordered recaudos-table"><tbody>' + htmlRecaudo + '</tbody></table>';
                        self.view.$el.find('#contenedor-recaudos-' + campoId).html(htmlTabla);
                    } else {
                        $tabla.append(htmlRecaudo);
                    }
                    
                    // Agregar input hidden
                    var $hiddenInputs = self.view.$el.find('#contenedor-recaudos-' + campoId + ' .recaudos-hidden-inputs');
                    if ($hiddenInputs.length === 0) {
                        self.view.$el.find('#contenedor-recaudos-' + campoId).append('<div class="recaudos-hidden-inputs"></div>');
                        $hiddenInputs = self.view.$el.find('#contenedor-recaudos-' + campoId + ' .recaudos-hidden-inputs');
                    }
                    $hiddenInputs.append('<input type="hidden" id="recaudo_' + recaudo.id + '_' + campoId + '" value="Modificar">');
                    
                    // Actualizar el select
                    self.actualizarSelectAgregar(campoId);
                    
                    // Inicializar tooltips
                    self.view.inicializarTooltipsRecaudos();
                    
                    Espo.Ui.success('Recaudo agregado a la lista');
                }
            })
            .catch(function (error) {
                console.error('Error obteniendo detalles del recaudo:', error);
            });
    };

    RecaudosDinamicosManager.prototype.getTipoPorCampoId = function (campoId) {
        var tipos = {
            'legal': ['Natural', 'Juridico'],
            'mercadeo': 'Mercadeo',
            'apoderado': 'Apoderado'
        };
        
        return tipos[campoId] || campoId;
    };

    RecaudosDinamicosManager.prototype.escapeHtml = function (text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };

    return RecaudosDinamicosManager;
});