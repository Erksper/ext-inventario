define('inventario:views/modules/modal-crear-recaudo', [], function () {
    
    var ModalCrearRecaudoManager = function (view) {
        this.view = view;
        this.modalHtml = null;
        this.modalInicializado = false;
    };

    ModalCrearRecaudoManager.prototype.inicializar = function () {
        if (this.modalInicializado) return;
        
        this.crearModalHTML();
        this.agregarModalAlDOM();
        this.setupEventListeners();
        
        this.modalInicializado = true;
        console.log('ModalCrearRecaudo inicializado');
    };

    ModalCrearRecaudoManager.prototype.crearModalHTML = function () {
        this.modalHtml = 
            '<div class="modal fade" id="modalCrearRecaudo" tabindex="-1" role="dialog" aria-hidden="true">' +
            '  <div class="modal-dialog" role="document">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '          <span aria-hidden="true">&times;</span>' +
            '        </button>' +
            '        <h4 class="modal-title"><i class="fas fa-plus-circle"></i> <span id="modalTitulo">Crear Nuevo Recaudo</span></h4>' +
            '      </div>' +
            '      <div class="modal-body">' +
            '        <div class="form-group">' +
            '          <label>Nombre del Recaudo *</label>' +
            '          <input type="text" id="nombreRecaudo" class="form-control" placeholder="Ingrese el nombre del recaudo">' +
            '        </div>' +
            '        <div class="form-group">' +
            '          <label>Descripción</label>' +
            '          <textarea id="descripcionRecaudo" class="form-control" rows="3" placeholder="Ingrese una descripción (opcional)"></textarea>' +
            '        </div>' +
            '        <input type="hidden" id="tipoRecaudoModal" value="">' +
            '      </div>' +
            '      <div class="modal-footer">' +
            '        <button type="button" class="btn btn-default" data-dismiss="modal">Cancelar</button>' +
            '        <button type="button" class="btn btn-primary" id="btnGuardarRecaudo">' +
            '          <i class="fas fa-save"></i> Guardar Recaudo' +
            '        </button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
    };

    ModalCrearRecaudoManager.prototype.agregarModalAlDOM = function () {
        if ($('#modalCrearRecaudo').length === 0) {
            $('body').append(this.modalHtml);
            console.log('Modal agregado al DOM');
        }
    };

    ModalCrearRecaudoManager.prototype.setupEventListeners = function () {
        var self = this;
        
        // Guardar recaudo
        $(document).off('click', '#btnGuardarRecaudo').on('click', '#btnGuardarRecaudo', function () {
            self.guardarNuevoRecaudo();
        });
        
        // Limpiar campos al cerrar modal
        $('#modalCrearRecaudo').off('hidden.bs.modal').on('hidden.bs.modal', function () {
            self.limpiarCampos();
        });
        
        // Permitir Enter para guardar
        $(document).off('keypress', '#nombreRecaudo, #descripcionRecaudo').on('keypress', '#nombreRecaudo, #descripcionRecaudo', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                $('#btnGuardarRecaudo').click();
            }
        });
    };

    ModalCrearRecaudoManager.prototype.mostrar = function (tipo) {
        this.inicializar();
        
        var tipoText = this.getTipoTexto(tipo);
        $('#modalTitulo').text('Crear Nuevo Recaudo ' + tipoText);
        $('#tipoRecaudoModal').val(tipo);
        
        // Enfocar en el campo de nombre
        setTimeout(function() {
            $('#nombreRecaudo').focus();
        }, 500);
        
        $('#modalCrearRecaudo').modal('show');
    };

    ModalCrearRecaudoManager.prototype.getTipoTexto = function (tipo) {
        switch(tipo) {
            case 'legal': return 'Legal';
            case 'mercadeo': return 'de Mercadeo';
            case 'apoderado': return 'de Apoderado';
            default: return '';
        }
    };

    ModalCrearRecaudoManager.prototype.guardarNuevoRecaudo = function () {
        var nombre = $('#nombreRecaudo').val();
        var descripcion = $('#descripcionRecaudo').val();
        var tipo = $('#tipoRecaudoModal').val();
        
        if (!nombre || nombre.trim() === '') {
            Espo.Ui.warning('El nombre del recaudo es requerido');
            $('#nombreRecaudo').focus();
            return;
        }
        
        var tipoBackend = this.mapearTipoBackend(tipo);
        var $btn = $('#btnGuardarRecaudo');
        var originalText = $btn.html();
        
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');
        
        var self = this;
        
        // Para legal, obtener el tipo de persona seleccionado
        var tipoPersonaSeleccionada = '';
        if (tipo === 'legal') {
            tipoPersonaSeleccionada = this.view.$el.find('#tipoPersona').val();
        }
        
        var requestData = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            tipo: tipoBackend,
            default: false
        };
        
        // Agregar tipoPersona si es legal
        if (tipo === 'legal' && tipoPersonaSeleccionada) {
            requestData.tipoPersona = tipoPersonaSeleccionada;
        }
        
        Espo.Ajax.postRequest('InvRecaudos/action/crearRecaudo', requestData)
            .then(function (response) {
                if (response.success) {
                    Espo.Ui.success('Recaudo creado exitosamente');
                    $('#modalCrearRecaudo').modal('hide');
                    
                    // Disparar evento SOLO UNA VEZ
                    $(document).trigger('recaudoCreado.inventario', {
                        tipo: tipo,
                        recaudoId: response.data.id,
                        recaudoNombre: response.data.name,
                        recaudoTipo: response.data.tipo
                    });
                    
                    // Actualizar inmediatamente el dropdown y la lista
                    self.actualizarListaDespuesDeCrear(tipo, response.data);
                } else {
                    Espo.Ui.error(response.error || 'Error al crear recaudo');
                }
            }).catch(function (error) {
                console.error('Error al crear recaudo:', error);
                Espo.Ui.error('Error al crear recaudo');
            }).finally(function () {
                $btn.prop('disabled', false).html(originalText);
            });
    };

    ModalCrearRecaudoManager.prototype.actualizarListaDespuesDeCrear = function (tipo, recaudoData) {
        var self = this;
        
        // Actualizar el dropdown correspondiente
        if (this.view.recaudosDinamicosManager) {
            this.view.recaudosDinamicosManager.cargarSelectAgregarRecaudos(
                this.view.recaudosDinamicosManager.getTipoPorCampoId(tipo),
                tipo
            );
            
            // Si estamos en la misma pestaña, agregar el recaudo inmediatamente a la lista
            if (tipo === 'legal') {
                // Verificar si el recaudo corresponde al tipo de persona seleccionado
                var tipoPersonaActual = this.view.$el.find('#tipoPersona').val();
                if (recaudoData.tipo === tipoPersonaActual) {
                    // Agregar a la lista inmediatamente
                    this.view.recaudosDinamicosManager.agregarRecaudoDesdeCreacion(recaudoData.id, tipo);
                }
            } else {
                // Para mercadeo y apoderado, agregar inmediatamente
                this.view.recaudosDinamicosManager.agregarRecaudoDesdeCreacion(recaudoData.id, tipo);
            }
        }
    };

    ModalCrearRecaudoManager.prototype.mapearTipoBackend = function (tipo) {
        var tipos = {
            'legal': ['Natural', 'Juridico'],
            'mercadeo': 'Mercadeo',
            'apoderado': 'Apoderado'
        };
        return tipos[tipo] || tipo;
    };

    ModalCrearRecaudoManager.prototype.limpiarCampos = function () {
        $('#nombreRecaudo').val('');
        $('#descripcionRecaudo').val('');
        $('#tipoRecaudoModal').val('');
    };

    return ModalCrearRecaudoManager;
});