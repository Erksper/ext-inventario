define('inventario:views/modules/recaudos-loader', [], function () {
    
    var RecaudosLoader = function (view) {
        this.view = view;
        this.recaudosCache = {};
    };

    RecaudosLoader.prototype.cargarRecaudosPorTipo = function (tipo) {
        var self = this;
        
        // Si ya tenemos los recaudos en cache, devolverlos
        if (this.recaudosCache[tipo]) {
            return Promise.resolve(this.recaudosCache[tipo]);
        }
        
        return new Promise(function (resolve, reject) {
            Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosByTipo', { tipo: tipo })
                .then(function (response) {
                    if (response.success && response.data) {
                        self.recaudosCache[tipo] = response.data;
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

    RecaudosLoader.prototype.crearHTMLRecaudos = function (recaudos, campoId) {
        var html = '';
        
        if (!recaudos || recaudos.length === 0) {
            return '<div class="alert alert-info">No hay recaudos disponibles</div>';
        }
        
        html += '<div class="recaudos-container">';
        html += '<table class="table table-bordered recaudos-table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th>Recaudo</th>';
        html += '<th><i class="fas fa-circle icon-verde"></i> Adecuado</th>';
        html += '<th><i class="fas fa-circle icon-amarillo"></i> Revisar</th>';
        html += '<th><i class="fas fa-circle icon-rojo"></i> Modificar</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        
        recaudos.forEach(function (recaudo) {
            html += '<tr class="recaudo-row">';
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

    RecaudosLoader.prototype.escapeHtml = function (text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };

    RecaudosLoader.prototype.getValoresRecaudos = function (campoId) {
        var valores = {};
        var $inputs = this.view.$el.find('input[id^="recaudo_"][id$="_' + campoId + '"]');
        
        $inputs.each(function () {
            var id = $(this).attr('id');
            var recaudoId = id.replace('recaudo_', '').replace('_' + campoId, '');
            valores[recaudoId] = $(this).val();
        });
        
        return valores;
    };

    return RecaudosLoader;
}); 