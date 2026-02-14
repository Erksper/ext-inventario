define('inventario:views/propiedad', [
    'view',
    'inventario:views/modules/semaforo',
    'inventario:views/modules/calculadora-notas',
    'inventario:views/modules/modal-crear-recaudo'
], function (Dep, SemaforoManager, CalculadoraNotas, ModalCrearRecaudoManager) {
    
    return Dep.extend({
        
        template: 'inventario:propiedad',

        setup: function () {
            Dep.prototype.setup.call(this);
            
            this.propiedadId = this.options.propiedadId;
            
            if (!this.propiedadId) {
                console.error('❌ NO HAY propiedadId');
                Espo.Ui.error('ID de propiedad no proporcionado');
                this.getRouter().navigate('#InvLista', { trigger: true });
                return;
            }
            
            this.datosYaCargados = false;
            this.cargandoDatos = false;  // NUEVO
            this.vistaYaRenderizada = false;
            
            this.inventarioId = null;
            this.inventarioData = null;
            this.propiedadData = null;
            
            this.subBuyersSeleccionados = [];
            this.initializeListasRecaudos();
            
            this.semaforoManager = new SemaforoManager(this);
            this.calculadoraNotas = new CalculadoraNotas(this);
            this.modalCrearRecaudo = new ModalCrearRecaudoManager(this);
            
            this.valoresRecaudosLegal = {};
            this.valoresRecaudosMercadeo = {};
            this.valoresRecaudosApoderado = {};
            
            this.panelsInitialized = false;
            this.datosCompletamenteCargados = false;
            
            // NUEVO: Contador de cargas pendientes
            this.cargasPendientes = 0;
            
            this.cargarDatos();
        },

        registrarCargaPendiente: function() {
            this.cargasPendientes++;
            console.log('📊 Cargas pendientes:', this.cargasPendientes);
        },

        marcarCargaCompletada: function() {
            this.cargasPendientes--;
            console.log('✅ Carga completada. Pendientes:', this.cargasPendientes);
            
            if (this.cargasPendientes <= 0) {
                this.cargasPendientes = 0;
                this.datosCompletamenteCargados = true;
                
                console.log('🎉 CARGAS COMPLETADAS');
                
                // Calcular notas
                this.calcularNotasPorcentajes();
                
                // Forzar cierre
                var self = this;
                this.$el.find('.panel-body').each(function(index, elem) {
                    var $body = $(elem);
                    if ($body.is(':visible')) {
                        $body.hide();
                        var $panel = $body.closest('.panel');
                        $panel.find('.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
                        console.log('🔒 Pre-timeout cerrado panel #' + index);
                    }
                });
                console.log('🔒 Panels cerrados antes de habilitar');
                
                // CAMBIADO: De 500ms a 200ms para reducir ventana de clicks
                console.log('⏰ Esperando 200ms...');
                
                setTimeout(function() {
                    console.log('⏰ Timeout completado');
                    
                    // Triple verificación
                    self.$el.find('.panel-body').each(function(index, elem) {
                        var $body = $(elem);
                        if ($body.is(':visible')) {
                            $body.hide();
                            var $panel = $body.closest('.panel');
                            $panel.find('.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
                            console.log('⚠️ PANEL TODAVÍA ABIERTO #' + index + ' - cerrado forzosamente');
                        }
                    });
                    
                    if (self.isRendered()) {
                        self.inicializarPanels();
                    }
                    
                    // Cuádruple verificación 100ms después
                    setTimeout(function() {
                        self.$el.find('.panel-body').each(function(index, elem) {
                            var $body = $(elem);
                            if ($body.is(':visible')) {
                                $body.hide();
                                var $panel = $body.closest('.panel');
                                $panel.find('.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
                                console.log('🚨 PANEL REABIERTO #' + index + ' - cerrando OTRA VEZ');
                            }
                        });
                    }, 100);
                    
                }, 200); // REDUCIDO de 500ms a 200ms
            }
        },

        initializeListasRecaudos: function () {
            this.listasRecaudos = {
                legal: {
                    natural: { mostrados: [], disponibles: [], esPorDefecto: false },
                    juridico: { mostrados: [], disponibles: [], esPorDefecto: false },
                    tipoActual: 'natural'
                },
                mercadeo: { mostrados: [], disponibles: [], esPorDefecto: false },
                apoderado: { mostrados: [], disponibles: [], esPorDefecto: false }
            };
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            // NUEVO: Evitar múltiples renders
            if (this.vistaYaRenderizada) {
                console.log('⚠️ Vista ya renderizada, saltando afterRender');
                return;
            }
            this.vistaYaRenderizada = true;
            
            console.log('🎨 afterRender iniciado');
            console.log('📍 panelsInitialized:', this.panelsInitialized);
            console.log('📍 datosCompletamenteCargados:', this.datosCompletamenteCargados);
            console.log('📍 datosYaCargados:', this.datosYaCargados);
            
            this.setupEventListeners();
            
            if (this.calculadoraNotas) {
                this.calculadoraNotas.inicializarPorcentajes();
            }
            
            if (this.modalCrearRecaudo) {
                this.modalCrearRecaudo.inicializar();
            }
            
            this.actualizarEstadosOtros();
            
            // Cierre post-render
            var self = this;
            setTimeout(function() {
                console.log('🚫 CIERRE POST-RENDER (100ms)');
                self.$el.find('.panel-body').each(function(index, elem) {
                    var $body = $(elem);
                    if ($body.is(':visible')) {
                        $body.hide();
                        var $panel = $body.closest('.panel');
                        $panel.find('.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
                        console.log('  → Cerrado panel #' + index);
                    }
                });
            }, 100);
            
            console.log('✅ afterRender completado (SIN inicializar panels)');
        },

        inicializarPanels: function() {
            // Protección: Solo ejecutar UNA VEZ
            if (this.panelsInitialized) {
                console.log('⚠️ Panels ya inicializados, saliendo...');
                return;
            }
            
            console.log('🎬 inicializarPanels llamado');
            
            this.panelsInitialized = true;
            this.inicializarSelect2SubBuyers();
            
            console.log('✅ Panels HABILITADOS');
        },

        setupEventListeners: function () {
            var self = this;
            
            // Toggle panels - CORREGIDO para evitar cierre automático
            this.$el.on('click', '[data-action="toggle-panel"]', function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📍 Click en toggle-panel');
                console.log('  → panelsInitialized:', self.panelsInitialized);
                console.log('  → datosCompletamenteCargados:', self.datosCompletamenteCargados);
                
                // CRÍTICO: Bloquear si aún no se habilitan los panels
                if (!self.panelsInitialized) {
                    console.log('❌ BLOQUEADO - esperando habilitación');
                    return false;
                }
                
                // NUEVO: Bloquear si los datos no terminaron de cargar
                if (!self.datosCompletamenteCargados) {
                    console.log('❌ BLOQUEADO - esperando carga de datos');
                    return false;
                }
                
                console.log('✅ PERMITIDO');
                self.togglePanel($(this).closest('.panel-heading')[0]);
            });

            // Botones de navegación
            this.$el.on('click', '[data-action="volver"], [data-action="cancelar"]', function () {
                window.location.href = '#InvLista';
                window.location.reload();   
            });

            this.$el.on('click', '[data-action="guardar"]', function () {
                self.guardarInventario();
            });

            // Apoderado
            this.$el.on('change', 'input[name="apoderado"]', function (e) {
                var mostrar = $(e.currentTarget).val() === 'true';
                self.mostrarObligaciones(mostrar);
                
                if (mostrar && self.listasRecaudos.apoderado.mostrados.length === 0) {
                    self.cargarYMostrarRecaudosApoderado();
                }
                
                self.calcularPorcentajeApoderado();
            });

            // Tipo de persona
            this.$el.on('change', '#tipoPersona', function (e) {
                self.cargarYMostrarRecaudosLegales($(e.target).val());
                self.calcularNotasPorcentajes();
            });

            // Buyer persona
            this.$el.on('change', '#buyerPersona', function (e) {
                self.cargarSubBuyersDisponibles($(e.target).val());
            });

            // Semáforos
            if (this.semaforoManager) {
                this.semaforoManager.setupEventListeners();
            }
            
            // Recaudos
            this.$el.on('click', '[data-action="selectRecaudoSemaforo"]', function (e) {
                self.seleccionarRecaudoSemaforo(e);
            });
            
            this.$el.on('click', '[data-action="showInfoRecaudo"]', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.mostrarInfoRecaudoModal(e);
            });
            
            this.$el.on('click', '[data-action="eliminarRecaudo"]', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.manejarEliminacionRecaudo(e);
            });
            
            this.$el.on('click', '.btn-agregar-recaudo', function (e) {
                e.preventDefault();
                self.manejarAgregarRecaudo(e);
            });
            
            // Selectores en panel "Otros"
            this.$el.on('change', '.select-otros', function (e) {
                self.manejarCambioSelectOtros(e);
            });
            
            // Escuchar evento de recaudo creado
            $(document).on('recaudoCreado.inventario', function (e, data) {
                self.onRecaudoCreado(data);
            });
        },

        togglePanel: function (element) {
            var $heading = $(element);
            var $panel = $heading.closest('.panel');
            var $body = $panel.find('.panel-body');
            var $icon = $heading.find('.fa-chevron-down, .fa-chevron-up');
            
            // Limpiar texto del título
            var panelTitle = $panel.find('.panel-title').clone();
            panelTitle.find('.nota-percentaje').remove();
            panelTitle.find('.fas').remove();
            var titleText = panelTitle.text().trim();
            
            var wasVisible = $body.is(':visible');
            
            console.log('🔘 togglePanel - Título:', titleText);
            console.log('  → Estado anterior:', wasVisible ? 'VISIBLE' : 'OCULTO');
            console.log('  → panelsInitialized:', this.panelsInitialized);
            
            if (wasVisible) {
                console.log('  → Acción: CERRANDO');
                
                // NUEVO: Forzar hide() en lugar de slideUp()
                $body.hide(); // Cambio de slideUp a hide
                $icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
                
                console.log('  → Hide() ejecutado');
            } else {
                console.log('  → Acción: ABRIENDO');
                
                // NUEVO: Forzar show() en lugar de slideDown()
                $body.show(); // Cambio de slideDown a show
                $icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
                
                console.log('  → Show() ejecutado');
            }
            
            // Verificación inmediata
            var estadoFinal = $body.is(':visible');
            console.log('  ✓ Estado final INMEDIATO:', estadoFinal ? 'VISIBLE' : 'OCULTO');
            
            // Verificación post-animación
            setTimeout(function() {
                var estadoFinalPost = $body.is(':visible');
                if (estadoFinal !== estadoFinalPost) {
                    console.log('  ⚠️ CAMBIÓ después de 250ms:', estadoFinalPost ? 'VISIBLE' : 'OCULTO');
                }
            }, 250);
        },

        verificarEstadoPanels: function() {
            console.log('🔍 VERIFICANDO ESTADO DE PANELS:');
            this.$el.find('.panel').each(function(index, panel) {
                var $panel = $(panel);
                var $body = $panel.find('.panel-body');
                var $title = $panel.find('.panel-title').clone();
                $title.find('.nota-percentaje').remove();
                $title.find('.fas').remove();
                var titleText = $title.text().trim();
                var visible = $body.is(':visible');
                
                console.log('  Panel #' + index + ': ' + titleText + ' → ' + (visible ? '✅ VISIBLE' : '❌ OCULTO'));
            });
        },

        mostrarObligaciones: function (mostrar) {
            var $contenedorRecaudos = this.$el.find('#contenedor-recaudos-apoderado');
            var $panelAgregar = this.$el.find('#panel-agregar-apoderado');
            
            if (mostrar) {
                $contenedorRecaudos.slideDown(200);
                $panelAgregar.slideDown(200);
            } else {
                $contenedorRecaudos.slideUp(200);
                $panelAgregar.slideUp(200);
            }
        },

        cargarDatos: function () {
            // Evitar doble carga
            if (this.datosYaCargados || this.cargandoDatos) {
                console.log('⚠️ Datos ya cargados o cargando, saltando duplicado');
                return;
            }
            
            this.cargandoDatos = true;
            console.log('🔄 Iniciando carga de datos...');
            
            var self = this;
            
            Espo.Ajax.getRequest('InvPropiedades/action/getOrCreate', {
                propiedadId: this.propiedadId
            })
                .then(function (response) {
                    if (response.success) {
                        self.inventarioData = response.data.inventario;
                        self.propiedadData = response.data.propiedad;
                        self.inventarioId = self.inventarioData.id;
                        
                        self.datosYaCargados = true;
                        self.cargandoDatos = false;
                        
                        console.log('✅ Datos cargados, llamando mostrarDatos()');
                        self.mostrarDatos();
                    } else {
                        self.$el.find('#loading-container').hide();
                        self.cargandoDatos = false;
                        Espo.Ui.error(response.error || 'Error al cargar datos');
                        self.getRouter().navigate('#InvLista', { trigger: true });
                    }
                })
                .catch(function (error) {
                    console.error('Error en Ajax:', error);
                    self.$el.find('#loading-container').hide();
                    self.cargandoDatos = false;
                    Espo.Ui.error('Error al cargar datos de la propiedad');
                    self.getRouter().navigate('#InvLista', { trigger: true });
                });
        },

        mostrarDatos: function () {
            var self = this;
            
            try {
                this.$el.find('#loading-container').hide();
                this.$el.find('#form-container').show();
                
                // Panel 1: Información de la propiedad
                this.mostrarInfoPropiedad();
                
                // Panel 2: Requisitos legales
                var tipoPersona = this.inventarioData.tipoPersona || 'Natural';
                this.$el.find('#tipoPersona').val(tipoPersona);
                
                this.registrarCargaPendiente();
                this.cargarYMostrarRecaudosLegales(tipoPersona);
                
                // Panel 3: Mercadeo
                this.registrarCargaPendiente();
                this.mostrarInfoMercadeo();
                
                // Panel 4: Apoderado
                this.mostrarInfoApoderado();
                
                // Panel 5: Otros
                this.mostrarInfoOtros();
                
                console.log('✅ Datos mostrados en UI');
                
                // NUEVO: Asegurar que todos los panels estén cerrados
                this.$el.find('.panel-body').hide();
                this.$el.find('.panel-heading .fas').removeClass('fa-chevron-up').addClass('fa-chevron-down');
                console.log('🔒 Todos los panels cerrados forzosamente');
                
            } catch (error) {
                console.error('Error en mostrarDatos:', error);
                this.$el.find('#loading-container').hide();
                this.$el.find('#form-container').show();
                
                this.cargasPendientes = 0;
                this.datosCompletamenteCargados = true;
                if (this.isRendered()) {
                    this.inicializarPanels();
                }
            }
            console.log('✅ Datos mostrados en UI');
        
            // NUEVO: Cerrar forzosamente INMEDIATAMENTE
            this.$el.find('.panel-body').each(function(index, elem) {
                $(elem).hide();
            });
            this.$el.find('.panel-heading .fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
            console.log('🔒 Todos los panels cerrados forzosamente (post-mostrarDatos)');

        },


        mostrarInfoPropiedad: function () {
            this.$el.find('#prop-tipoOperacion').text(this.propiedadData.tipoOperacion || '-');
            this.$el.find('#prop-tipoPropiedad').text(this.propiedadData.tipoPropiedad || '-');
            this.$el.find('#prop-subTipoPropiedad').text(this.propiedadData.subTipoPropiedad || '-');
            this.$el.find('#prop-m2C').text(this.propiedadData.m2C ? this.propiedadData.m2C + ' m²' : '-');
            this.$el.find('#prop-m2T').text(this.propiedadData.m2T ? this.propiedadData.m2T + ' m²' : '-');
            this.$el.find('#prop-ubicacion').text(this.propiedadData.ubicacion || '-');
            this.$el.find('#prop-asesor').text(this.propiedadData.asesorNombre || '-');
            
            // Fecha de publicación
            if (this.propiedadData.fechaAlta) {
                var fecha = new Date(this.propiedadData.fechaAlta);
                this.$el.find('#prop-fechaAlta').text(fecha.toLocaleDateString('es-ES'));
            } else {
                this.$el.find('#prop-fechaAlta').text('-');
            }
            
            // Días en el mercado
            var diasEnMercado = this.calcularDiasEnMercado(this.propiedadData.fechaAlta);
            this.$el.find('#prop-diasMercado').text(diasEnMercado);
            
            // Status
            var $statusBadge = this.$el.find('#prop-status');
            $statusBadge.text(this.propiedadData.status || '-');
            
            var statusColors = {
                'Disponible': '#27ae60',
                'Reservada': '#f39c12',
                'Vendida': '#e74c3c',
                'Rentada': '#3498db',
                'Retirada': '#95a5a6',
                'En promocion': '#27ae60'
            };
            var color = statusColors[this.propiedadData.status] || '#95a5a6';
            $statusBadge.css({ 'background-color': color, 'color': 'white' });
        },

        calcularDiasEnMercado: function(fechaAlta) {
            if (!fechaAlta) return '-';
            
            var fechaAltaDate = new Date(fechaAlta);
            var hoy = new Date();
            
            var diferenciaMs = hoy - fechaAltaDate;
            var dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
            
            return dias + ' días';
        },

        mostrarInfoMercadeo: function () {
            var self = this;
            
            var buyerPersona = this.inventarioData.buyerPersona || this.inventarioData.buyer || 'Comprador';
            this.$el.find('#buyerPersona').val(buyerPersona);
            
            // Cargar recaudos de mercadeo (ya cuenta como pendiente)
            this.cargarYMostrarRecaudosMercadeo()
                .then(function() {
                    // Marcar como completado
                    self.marcarCargaCompletada();
                })
                .catch(function(error) {
                    console.error('Error en mostrarInfoMercadeo:', error);
                    self.marcarCargaCompletada(); // Marcar aunque falle
                });
            
            // Cargar sub buyers (no bloquean)
            this.cargarSubBuyersDisponibles(buyerPersona);
            this.cargarSubBuyersSeleccionados();
        },

        mostrarInfoApoderado: function () {
            var self = this;
            var apoderado = this.inventarioData.apoderado || false;
            
            if (apoderado) {
                this.$el.find('input[name="apoderado"][value="true"]').prop('checked', true);
                this.mostrarObligaciones(true);
                
                // Registrar carga pendiente
                this.registrarCargaPendiente();
                
                this.cargarYMostrarRecaudosApoderado()
                    .then(function() {
                        self.marcarCargaCompletada();
                    })
                    .catch(function(error) {
                        console.error('Error en mostrarInfoApoderado:', error);
                        self.marcarCargaCompletada();
                    });
            } else {
                this.$el.find('input[name="apoderado"][value="false"]').prop('checked', true);
                this.mostrarObligaciones(false);
                this.$el.find('#nota-apoderado').text('0%');
                // No hay carga pendiente
            }
        },

        mostrarInfoOtros: function () {
            var exclusividad = this.inventarioData.exclusividad || 'Sin exclusividad';
            var precio = this.inventarioData.precio || 'En rango';
            var ubicacion = this.inventarioData.ubicacion || 'Ubicación no atractiva';
            var demanda = this.inventarioData.demanda || 'Media demanda';
            
            this.$el.find('#select-exclusividad').val(exclusividad);
            this.$el.find('#select-precio').val(precio);
            this.$el.find('#select-ubicacion').val(ubicacion);
            this.$el.find('#select-demanda').val(demanda);
            
            this.actualizarEstiloSelect('exclusividad', exclusividad);
            this.actualizarEstiloSelect('precio', precio);
            this.actualizarEstiloSelect('ubicacion', ubicacion);
            this.actualizarEstiloSelect('demanda', demanda);
        },

        // ========== SUB BUYERS (MULTI-SELECT) ==========
        
        inicializarSelect2SubBuyers: function () {
            var $select = this.$el.find('#subBuyerPersona');
            
            if ($select.length === 0) return;
            
            // Inicializar Select2 para mejor UX en multi-select
            if (typeof $select.select2 === 'function') {
                $select.select2({
                    placeholder: 'Seleccione sub buyers',
                    allowClear: true,
                    width: '100%'
                });
            }
        },

        cargarSubBuyersDisponibles: function (buyerTipo) {
            var self = this;
            var $select = this.$el.find('#subBuyerPersona');
            
            // CORREGIDO: Usar el endpoint correcto
            Espo.Ajax.getRequest('InvPropiedades/action/getSubBuyersByBuyer', {
                buyer: buyerTipo
            })
            .then(function (response) {
                $select.empty();
                
                if (response.success && response.data && response.data.length > 0) {
                    response.data.forEach(function (subBuyer) {
                        $select.append(
                            $('<option></option>')
                                .attr('value', subBuyer.id)
                                .text(subBuyer.name)
                        );
                    });
                } else {
                    $select.append('<option value="" disabled>No hay sub buyers disponibles</option>');
                }
                
                // Restaurar selección si existe
                if (self.subBuyersSeleccionados.length > 0) {
                    $select.val(self.subBuyersSeleccionados);
                    if (typeof $select.select2 === 'function') {
                        $select.trigger('change.select2');
                    }
                }
            })
            .catch(function (error) {
                console.error('Error cargando sub buyers:', error);
                $select.html('<option value="" disabled>Error al cargar sub buyers</option>');
            });
        },

        // LÍNEA ~390 - Modificar cargarSubBuyersSeleccionados
        cargarSubBuyersSeleccionados: function () {
            var self = this;
            
            if (!this.inventarioId) {
                console.log('No hay inventarioId aún');
                return;
            }
            
            Espo.Ajax.getRequest('InvPropiedades/action/getSubBuyersPropiedad', {
                inventarioId: this.inventarioId
            })
            .then(function (response) {
                if (response.success && response.data) {
                    self.subBuyersSeleccionados = response.data.map(function (sb) {
                        return sb.id;
                    });
                    
                    // Marcar en el select
                    var $select = self.$el.find('#subBuyerPersona');
                    $select.val(self.subBuyersSeleccionados);
                    if (typeof $select.select2 === 'function') {
                        $select.trigger('change.select2');
                    }
                    
                    console.log('✅ Sub buyers cargados:', self.subBuyersSeleccionados);
                }
            })
            .catch(function (error) {
                console.error('Error cargando sub buyers seleccionados:', error);
                // NO es error crítico, continuar
            });
        },

        obtenerSubBuyersSeleccionados: function () {
            var $select = this.$el.find('#subBuyerPersona');
            return $select.val() || [];
        },

        // ========== CARGA DE RECAUDOS ==========
        
        cargarYMostrarRecaudosLegales: function (tipoPersona) {
            var self = this;
            var $contenedor = this.$el.find('#contenedor-recaudos-legal');
            
            $contenedor.html('<div class="text-center" style="padding: 20px;"><div class="spinner-small"></div><p>Cargando requisitos legales...</p></div>');
            
            return this.cargarRecaudosPorTipo('legal', tipoPersona)
                .then(function (resultado) {
                    var tipoPersonaLower = tipoPersona.toLowerCase();
                    self.listasRecaudos.legal[tipoPersonaLower] = resultado;
                    self.listasRecaudos.legal.tipoActual = tipoPersonaLower;
                    
                    self.actualizarVistaRecaudos('legal', tipoPersonaLower, resultado);
                    self.actualizarDropdownRecaudos('legal', resultado.disponibles);
                    
                    // Marcar como completado
                    self.marcarCargaCompletada();
                    
                    return resultado;
                })
                .catch(function(error) {
                    console.error('Error cargando legales:', error);
                    $contenedor.html('<div class="alert alert-danger">Error al cargar requisitos legales</div>');
                    self.marcarCargaCompletada(); // Marcar aunque falle
                });
        },

        cargarYMostrarRecaudosMercadeo: function () {
            var self = this;
            var $contenedor = this.$el.find('#contenedor-recaudos-mercadeo');
            
            $contenedor.html('<div class="text-center" style="padding: 20px;"><div class="spinner-small"></div><p>Cargando elementos de mercadeo...</p></div>');
            
            return this.cargarRecaudosPorTipo('mercadeo', 'Mercadeo')
                .then(function (resultado) {
                    self.listasRecaudos.mercadeo = resultado;
                    
                    self.actualizarVistaRecaudos('mercadeo', null, resultado);
                    self.actualizarDropdownRecaudos('mercadeo', resultado.disponibles);
                    
                    return resultado;
                })
                .catch(function(error) {
                    console.error('Error cargando mercadeo:', error);
                    $contenedor.html('<div class="alert alert-danger">Error al cargar mercadeo</div>');
                });
        },

        cargarYMostrarRecaudosApoderado: function () {
            var self = this;
            var $contenedor = this.$el.find('#contenedor-recaudos-apoderado');
            
            if (this.listasRecaudos.apoderado.mostrados.length > 0) {
                this.actualizarVistaRecaudos('apoderado', null, this.listasRecaudos.apoderado);
                this.calcularPorcentajeApoderado();
                return Promise.resolve(this.listasRecaudos.apoderado);
            }
            
            $contenedor.html('<div class="text-center" style="padding: 20px;"><div class="spinner-small"></div><p>Cargando requisitos de apoderado...</p></div>');
            
            return this.cargarRecaudosPorTipo('apoderado', 'Apoderado')
                .then(function (resultado) {
                    self.listasRecaudos.apoderado = resultado;
                    
                    self.actualizarVistaRecaudos('apoderado', null, resultado);
                    self.actualizarDropdownRecaudos('apoderado', resultado.disponibles);
                    self.calcularPorcentajeApoderado();
                    
                    return resultado;
                })
                .catch(function(error) {
                    console.error('Error cargando apoderado:', error);
                    $contenedor.html('<div class="alert alert-danger">Error al cargar apoderado</div>');
                });
        },

        cargarRecaudosPorTipo: function (tipo, tipoBackend) {
            var self = this;
            
            return new Promise(function (resolve, reject) {
                Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosGuardados', {
                    propiedadId: self.propiedadId,
                    tipo: tipoBackend
                })
                .then(function (response) {
                    if (response.success && response.data) {
                        var recaudosGuardados = response.data.recaudos || [];
                        var esPorDefecto = response.data.esPorDefecto || false;
                        
                        // NUEVO: Guardar estados en memoria desde el servidor
                        recaudosGuardados.forEach(function(recaudo) {
                            var recaudoId = String(recaudo.id);
                            var estado = recaudo.estado || 'Modificar/No Tiene';
                            
                            if (tipo === 'legal') {
                                self.valoresRecaudosLegal[recaudoId] = estado;
                            } else if (tipo === 'mercadeo') {
                                self.valoresRecaudosMercadeo[recaudoId] = estado;
                            } else if (tipo === 'apoderado') {
                                self.valoresRecaudosApoderado[recaudoId] = estado;
                            }
                        });
                        
                        return Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosByTipo', {
                            tipo: tipoBackend
                        })
                        .then(function (response2) {
                            if (response2.success && response2.data) {
                                var todosRecaudos = response2.data;
                                var recaudosMostradosIds = recaudosGuardados.map(function(r) {
                                    return String(r.id);
                                });
                                
                                var recaudosDisponibles = todosRecaudos.filter(function(recaudo) {
                                    return !recaudosMostradosIds.includes(String(recaudo.id));
                                });
                                
                                resolve({
                                    mostrados: recaudosGuardados,
                                    disponibles: recaudosDisponibles,
                                    esPorDefecto: esPorDefecto
                                });
                            }
                        });
                    }
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos:', error);
                    reject(error);
                });
            });
        },

        // ========== MANEJO DE RECAUDOS ==========
        
        manejarAgregarRecaudo: function (e) {
            var $button = $(e.currentTarget);
            var tipo = $button.data('tipo');
            var $select = this.$el.find('#select-agregar-' + tipo);
            var recaudoId = $select.val();
            
            if (!recaudoId) {
                Espo.Ui.warning('Por favor seleccione un elemento para agregar');
                return;
            }
            
            if (recaudoId === 'crear_nuevo') {
                this.mostrarModalCrearRecaudo(tipo);
                $select.val('');
            } else {
                this.agregarRecaudo(tipo, recaudoId);
                $select.val('');
            }
        },

        agregarRecaudo: function (campoId, recaudoId) {
            recaudoId = String(recaudoId);
            
            var lista = this.obtenerListaActual(campoId);
            
            if (this.recaudoEstaEnMostrados(lista, recaudoId)) {
                Espo.Ui.warning('Este recaudo ya está en la lista');
                return;
            }
            
            var recaudoIndex = lista.disponibles.findIndex(function(r) {
                return String(r.id) === recaudoId;
            });
            
            if (recaudoIndex === -1) {
                Espo.Ui.warning('Recaudo no disponible');
                return;
            }
            
            var recaudo = lista.disponibles[recaudoIndex];
            lista.disponibles.splice(recaudoIndex, 1);
            lista.mostrados.push(recaudo);
            lista.esPorDefecto = false;
            
            var tipoPersona = campoId === 'legal' ? this.$el.find('#tipoPersona').val().toLowerCase() : null;
            this.actualizarVistaRecaudos(campoId, tipoPersona, lista);
            this.actualizarDropdownRecaudos(campoId, lista.disponibles);
            
            Espo.Ui.success('Recaudo agregado correctamente');
        },

        manejarEliminacionRecaudo: function (e) {
            var $target = $(e.currentTarget);
            var recaudoId = String($target.data('recaudo-id'));
            var campoId = $target.data('campo-id');
            
            if (!confirm('¿Está seguro de que desea eliminar este elemento?')) {
                return;
            }
            
            this.eliminarRecaudo(campoId, recaudoId);
        },

        eliminarRecaudo: function (campoId, recaudoId) {
            recaudoId = String(recaudoId);
            
            var lista = this.obtenerListaActual(campoId);
            
            var recaudoIndex = lista.mostrados.findIndex(function(r) {
                return String(r.id) === recaudoId;
            });
            
            if (recaudoIndex === -1) {
                console.warn('Recaudo no encontrado en mostrados:', recaudoId);
                return;
            }
            
            var recaudo = lista.mostrados[recaudoIndex];
            lista.mostrados.splice(recaudoIndex, 1);
            
            if (!this.recaudoEstaEnDisponibles(lista, recaudoId)) {
                lista.disponibles.push(recaudo);
            }
            
            this.eliminarValorRecaudo(campoId, recaudoId);
            
            var tipoPersona = campoId === 'legal' ? this.$el.find('#tipoPersona').val().toLowerCase() : null;
            this.actualizarVistaRecaudos(campoId, tipoPersona, lista);
            this.actualizarDropdownRecaudos(campoId, lista.disponibles);
            
            Espo.Ui.success('Recaudo eliminado de la lista');
        },

        onRecaudoCreado: function (data) {
            var tipo = data.tipo;
            var recaudoId = String(data.recaudoId);
            var recaudoNombre = data.recaudoNombre;
            var recaudoTipo = data.recaudoTipo;
            
            var lista = this.obtenerListaActual(tipo);
            
            if (this.recaudoEstaEnMostrados(lista, recaudoId) || 
                this.recaudoEstaEnDisponibles(lista, recaudoId)) {
                return;
            }
            
            var nuevoRecaudo = {
                id: recaudoId,
                name: recaudoNombre,
                descripcion: '',
                default: false,
                tipo: recaudoTipo,
                estado: 'Modificar/No Tiene'
            };
            
            lista.mostrados.push(nuevoRecaudo);
            lista.esPorDefecto = false;
            
            var tipoPersona = tipo === 'legal' ? this.$el.find('#tipoPersona').val().toLowerCase() : null;
            this.actualizarVistaRecaudos(tipo, tipoPersona, lista);
            this.actualizarDropdownRecaudos(tipo, lista.disponibles);
            
            Espo.Ui.success('Recaudo creado y agregado a la lista');
        },

        // ========== UTILIDADES ==========
        
        obtenerListaActual: function (campoId) {
            if (campoId === 'legal') {
                // CORREGIDO: Verificar que existe el elemento antes de leer
                var $tipoPersona = this.$el.find('#tipoPersona');
                if ($tipoPersona.length === 0) {
                    // Si no existe el elemento, usar el valor del inventario
                    var tipoPersona = this.inventarioData.tipoPersona || 'Natural';
                    return this.listasRecaudos.legal[tipoPersona.toLowerCase()];
                }
                var tipoPersona = $tipoPersona.val();
                if (!tipoPersona) {
                    tipoPersona = this.inventarioData.tipoPersona || 'Natural';
                }
                return this.listasRecaudos.legal[tipoPersona.toLowerCase()];
            }
            return this.listasRecaudos[campoId];
        },

        recaudoEstaEnMostrados: function (lista, recaudoId) {
            return lista.mostrados.some(function(r) {
                return String(r.id) === String(recaudoId);
            });
        },

        recaudoEstaEnDisponibles: function (lista, recaudoId) {
            return lista.disponibles.some(function(r) {
                return String(r.id) === String(recaudoId);
            });
        },

        eliminarValorRecaudo: function (campoId, recaudoId) {
            if (campoId === 'legal') {
                delete this.valoresRecaudosLegal[recaudoId];
                this.calcularNotasPorcentajes();
            } else if (campoId === 'mercadeo') {
                delete this.valoresRecaudosMercadeo[recaudoId];
                this.calcularNotasPorcentajes();
            } else if (campoId === 'apoderado') {
                delete this.valoresRecaudosApoderado[recaudoId];
                this.calcularPorcentajeApoderado();
            }
        },

        // ========== ACTUALIZACIÓN UI ==========
        
        actualizarVistaRecaudos: function (tipo, tipoPersona, lista) {
            var $contenedor = this.$el.find('#contenedor-recaudos-' + tipo);
            
            if (lista.mostrados.length === 0) {
                $contenedor.html('<div class="alert alert-info">No hay recaudos para mostrar</div>');
            } else {
                var html = this.crearHTMLRecaudos(lista.mostrados, tipo, lista.esPorDefecto);
                $contenedor.html(html);
                this.inicializarTooltipsRecaudos();
                
                // NUEVO: Restaurar selecciones previas
                this.restaurarSeleccionesRecaudos(tipo);
            }
        },

        restaurarSeleccionesRecaudos: function(campoId) {
            var valores = campoId === 'legal' ? this.valoresRecaudosLegal :
                        campoId === 'mercadeo' ? this.valoresRecaudosMercadeo :
                        this.valoresRecaudosApoderado;
            
            // Recorrer valores guardados y marcar los divs correspondientes
            for (var recaudoId in valores) {
                if (valores.hasOwnProperty(recaudoId)) {
                    var valor = valores[recaudoId];
                    var $opcion = this.$el.find(
                        '[data-recaudo-id="' + recaudoId + '"]' +
                        '[data-campo-id="' + campoId + '"]' +
                        '[data-valor="' + valor + '"]'
                    );
                    $opcion.addClass('selected');
                }
            }
        },

        actualizarDropdownRecaudos: function (campoId, recaudosDisponibles) {
            var $select = this.$el.find('#select-agregar-' + campoId);
            var $panel = this.$el.find('#panel-agregar-' + campoId);
            
            if ($select.length === 0) return;
            
            $select.empty();
            $select.append('<option value="">Seleccione un elemento para agregar</option>');
            
            if (!recaudosDisponibles || recaudosDisponibles.length === 0) {
                $select.append('<option value="" disabled>No hay elementos disponibles para agregar</option>');
            } else {
                recaudosDisponibles.forEach(function (recaudo) {
                    $select.append('<option value="' + recaudo.id + '">' + recaudo.name + '</option>');
                });
            }
            
            $select.append('<option value="crear_nuevo">+ Crear nuevo requisito</option>');
            $panel.show();
        },

        crearHTMLRecaudos: function (recaudos, campoId, esPorDefecto) {
            var self = this;
            var html = '<div class="recaudos-container">';
            html += '<table class="table table-bordered recaudos-table">';
            html += '<thead><tr>';
            html += '<th>Recaudo</th>';

            // APODERADO: Solo 2 opciones
            if (campoId === 'apoderado') {
                html += '<th><i class="fas fa-circle icon-verde"></i> Lo tiene</th>';
                html += '<th><i class="fas fa-circle icon-rojo"></i> No lo tiene</th>';
            } else {
                // LEGAL y MERCADEO: 3 opciones
                html += '<th><i class="fas fa-circle icon-verde"></i> Adecuado</th>';
                html += '<th><i class="fas fa-circle icon-amarillo"></i> Revisar</th>';
                html += '<th><i class="fas fa-circle icon-rojo"></i> Modificar/No Tiene</th>';
            }

            html += '<th>Acción</th>';
            html += '</tr></thead><tbody>';
            
            recaudos.forEach(function (recaudo) {
                var recaudoId = String(recaudo.id);
                html += '<tr class="recaudo-row" data-recaudo-id="' + recaudoId + '">';
                html += '<td><div class="recaudo-texto-container">';
                
                if (recaudo.descripcion && recaudo.descripcion.trim() !== '') {
                    html += '<span class="recaudo-icon-space">';
                    html += '<i class="fas fa-info-circle info-icon" data-action="showInfoRecaudo" ';
                    html += 'data-info="' + self.escapeHtml(recaudo.descripcion) + '" ';
                    html += 'data-recaudo-texto="' + self.escapeHtml(recaudo.name) + '"></i>';
                    html += '</span>';
                } else {
                    html += '<span class="recaudo-icon-space"></span>';
                }
                
                html += '<h4>' + self.escapeHtml(recaudo.name) + '</h4></div></td>';
                
                // Opciones semáforo
                if (campoId === 'apoderado') {
                    // Solo 2 opciones para apoderado
                    html += '<td><div class="color-option color-verde" ';
                    html += 'data-action="selectRecaudoSemaforo" ';
                    html += 'data-recaudo-id="' + recaudoId + '" ';
                    html += 'data-campo-id="' + campoId + '" ';
                    html += 'data-valor="Adecuado"></div></td>';
                    
                    html += '<td><div class="color-option color-rojo" ';
                    html += 'data-action="selectRecaudoSemaforo" ';
                    html += 'data-recaudo-id="' + recaudoId + '" ';
                    html += 'data-campo-id="' + campoId + '" ';
                    html += 'data-valor="Modificar/No Tiene"></div></td>';
                } else {
                    // 3 opciones para legal y mercadeo
                    html += '<td><div class="color-option color-verde" ';
                    html += 'data-action="selectRecaudoSemaforo" ';
                    html += 'data-recaudo-id="' + recaudoId + '" ';
                    html += 'data-campo-id="' + campoId + '" ';
                    html += 'data-valor="Adecuado"></div></td>';
                    
                    html += '<td><div class="color-option color-amarillo" ';
                    html += 'data-action="selectRecaudoSemaforo" ';
                    html += 'data-recaudo-id="' + recaudoId + '" ';
                    html += 'data-campo-id="' + campoId + '" ';
                    html += 'data-valor="Revisar"></div></td>';
                    
                    html += '<td><div class="color-option color-rojo" ';
                    html += 'data-action="selectRecaudoSemaforo" ';
                    html += 'data-recaudo-id="' + recaudoId + '" ';
                    html += 'data-campo-id="' + campoId + '" ';
                    html += 'data-valor="Modificar/No Tiene"></div></td>';
                }
                
                html += '<td><button class="btn-eliminar-recaudo" ';
                html += 'data-action="eliminarRecaudo" ';
                html += 'data-recaudo-id="' + recaudoId + '" ';
                html += 'data-campo-id="' + campoId + '">';
                html += '<i class="fas fa-minus-circle"></i></button></td>';
                html += '</tr>';
            });
            
            html += '</tbody></table></div>';
            return html;
        },

        // ========== PANEL "OTROS" ==========
        
        manejarCambioSelectOtros: function (e) {
            var $select = $(e.currentTarget);
            var campo = $select.data('campo');
            var valor = $select.val();
            
            this.actualizarEstiloSelect(campo, valor);
            this.calcularEstatusPropiedad();
        },

        actualizarEstiloSelect: function (campo, valor) {
            var $select = this.$el.find('#select-' + campo);
            
            $select.removeClass('select-verde select-amarillo select-rojo');
            
            var colorClass = this.obtenerColorClassPorValor(campo, valor);
            $select.addClass(colorClass);
        },

        obtenerColorClassPorValor: function (campo, valor) {
            var verdes = [
                'Exclusividad pura o total con contrato firmado',
                'En rango',
                'Ubicación atractiva',
                'Alta demanda'
            ];
            
            var amarillos = [
                'Exclusividad interna de CENTURY con contrato firmado',
                'Cercano al rango de precio',
                'Ubicación medianamente atractiva',
                'Media demanda'
            ];
            
            if (verdes.includes(valor)) return 'select-verde';
            if (amarillos.includes(valor)) return 'select-amarillo';
            return 'select-rojo';
        },

        actualizarEstadosOtros: function () {
            var campos = ['exclusividad', 'precio', 'ubicacion', 'demanda'];
            campos.forEach(function(campo) {
                var valor = this.$el.find('#select-' + campo).val();
                if (valor) {
                    this.actualizarEstiloSelect(campo, valor);
                }
            }.bind(this));
        },

        // ========== CÁLCULOS ==========
        
        seleccionarRecaudoSemaforo: function (e) {
            var $target = $(e.currentTarget);
            var recaudoId = $target.data('recaudo-id');
            var campoId = $target.data('campo-id');
            var valor = $target.data('valor');
            
            this.$el.find('[data-recaudo-id="' + recaudoId + '"][data-campo-id="' + campoId + '"]')
                .removeClass('selected');
            $target.addClass('selected');
            
            if (campoId === 'legal') {
                this.valoresRecaudosLegal[recaudoId] = valor;
            } else if (campoId === 'mercadeo') {
                this.valoresRecaudosMercadeo[recaudoId] = valor;
            } else if (campoId === 'apoderado') {
                this.valoresRecaudosApoderado[recaudoId] = valor;
            }
            
            this.calcularNotasPorcentajes();
        },

        calcularNotasPorcentajes: function () {
            console.log('📊 === CALCULANDO NOTAS Y PORCENTAJES ===');
            
            this.calcularPorcentajeLegal();
            this.calcularPorcentajeMercadeo();
            this.calcularPorcentajeApoderado();
            
            // IMPORTANTE: Calcular estatus propiedad
            this.calcularEstatusPropiedad();
            
            console.log('✅ Cálculos completados');
        },

        calcularPorcentajeLegal: function () {
            var lista = this.obtenerListaActual('legal');
            var totalRecaudos = lista.mostrados.length;
            
            if (totalRecaudos === 0) {
                this.$el.find('#nota-legal')
                    .html('<span class="badge-color" style="background-color: #e74c3c;"></span>');
                return;
            }
            
            var completosRecaudos = 0;
            lista.mostrados.forEach(function(recaudo) {
                if (this.valoresRecaudosLegal[recaudo.id] === 'Adecuado') {
                    completosRecaudos++;
                }
            }.bind(this));
            
            var porcentaje = Math.round((completosRecaudos / totalRecaudos) * 100);
            
            var color = '#e74c3c';
            if (porcentaje >= 90) color = '#27ae60';
            else if (porcentaje >= 80) color = '#f39c12';
            
            this.$el.find('#nota-legal')
                .html('<span class="badge-color" style="background-color: ' + color + ';"></span>');
        },

        calcularPorcentajeMercadeo: function () {
            var lista = this.listasRecaudos.mercadeo;
            var totalRecaudos = lista.mostrados.length;
            
            if (totalRecaudos === 0) {
                this.$el.find('#nota-mercadeo')
                    .html('<span class="badge-color" style="background-color: #e74c3c;"></span>');
                return;
            }
            
            var completosRecaudos = 0;
            lista.mostrados.forEach(function(recaudo) {
                if (this.valoresRecaudosMercadeo[recaudo.id] === 'Adecuado') {
                    completosRecaudos++;
                }
            }.bind(this));
            
            var porcentaje = Math.round((completosRecaudos / totalRecaudos) * 100);
            
            var color = '#e74c3c';
            if (porcentaje >= 90) color = '#27ae60';
            else if (porcentaje >= 70) color = '#f39c12';
            
            this.$el.find('#nota-mercadeo')
                .html('<span class="badge-color" style="background-color: ' + color + ';"></span>');
        },

        calcularPorcentajeApoderado: function () {
            var tieneApoderado = this.$el.find('input[name="apoderado"]:checked').val() === 'true';
            
            if (!tieneApoderado) {
                this.$el.find('#nota-apoderado').text('0%').css('color', '#95a5a6');
                return;
            }
            
            var lista = this.listasRecaudos.apoderado;
            var totalRecaudos = lista.mostrados.length;
            
            if (totalRecaudos === 0) {
                this.$el.find('#nota-apoderado').text('0%').css('color', '#95a5a6');
                return;
            }
            
            var completosRecaudos = 0;
            lista.mostrados.forEach(function(recaudo) {
                // En apoderado: "Adecuado" = Lo tiene
                if (this.valoresRecaudosApoderado[recaudo.id] === 'Adecuado') {
                    completosRecaudos++;
                }
            }.bind(this));
            
            var porcentaje = Math.round((completosRecaudos / totalRecaudos) * 100);
            
            var color = '#95a5a6';
            if (porcentaje >= 90) color = '#27ae60';
            else if (porcentaje >= 70) color = '#f39c12';
            else if (porcentaje > 0) color = '#e74c3c';
            
            this.$el.find('#nota-apoderado').text(porcentaje + '%').css('color', color);
        },

        calcularEstatusPropiedad: function () {
            console.log('🎯 === CALCULANDO ESTATUS PROPIEDAD ===');
            
            var items = [];
            
            // 1. Legal (calculado)
            var legalLista = this.obtenerListaActual('legal');
            var legalTotal = legalLista.mostrados.length;
            var legalCompletos = 0;
            
            legalLista.mostrados.forEach(function(recaudo) {
                if (this.valoresRecaudosLegal[recaudo.id] === 'Adecuado') {
                    legalCompletos++;
                }
            }.bind(this));
            
            var legalPorcentaje = legalTotal > 0 ? Math.round((legalCompletos / legalTotal) * 100) : 0;
            var legalColor = legalPorcentaje >= 90 ? 'Verde' : (legalPorcentaje >= 80 ? 'Amarillo' : 'Rojo');
            items.push({ nombre: 'Legal', valor: legalColor });
            console.log('  📊 Legal:', legalPorcentaje + '%', '→', legalColor);
            
            // 2. Mercadeo (calculado)
            var mercadeoLista = this.listasRecaudos.mercadeo;
            var mercadeoTotal = mercadeoLista.mostrados.length;
            var mercadeoCompletos = 0;
            
            mercadeoLista.mostrados.forEach(function(recaudo) {
                if (this.valoresRecaudosMercadeo[recaudo.id] === 'Adecuado') {
                    mercadeoCompletos++;
                }
            }.bind(this));
            
            var mercadeoPorcentaje = mercadeoTotal > 0 ? Math.round((mercadeoCompletos / mercadeoTotal) * 100) : 0;
            var mercadeoColor = mercadeoPorcentaje >= 90 ? 'Verde' : (mercadeoPorcentaje >= 70 ? 'Amarillo' : 'Rojo');
            items.push({ nombre: 'Mercadeo', valor: mercadeoColor });
            console.log('  📊 Mercadeo:', mercadeoPorcentaje + '%', '→', mercadeoColor);
            
            // 3. Precio (selector)
            var precio = this.$el.find('#select-precio').val();
            var precioColor = 'Rojo';
            if (precio === 'En rango') precioColor = 'Verde';
            else if (precio === 'Cercano al rango de precio') precioColor = 'Amarillo';
            else if (precio === 'Fuera del rango de precio') precioColor = 'Rojo';
            items.push({ nombre: 'Precio', valor: precioColor });
            console.log('  📊 Precio:', precio, '→', precioColor);
            
            // 4. Exclusividad (selector)
            var exclusividad = this.$el.find('#select-exclusividad').val();
            var exclusividadColor = 'Rojo';
            if (exclusividad === 'Exclusividad pura o total con contrato firmado') exclusividadColor = 'Verde';
            else if (exclusividad === 'Exclusividad interna de CENTURY con contrato firmado') exclusividadColor = 'Amarillo';
            else if (exclusividad === 'Sin exclusividad') exclusividadColor = 'Rojo';
            items.push({ nombre: 'Exclusividad', valor: exclusividadColor });
            console.log('  📊 Exclusividad:', exclusividad, '→', exclusividadColor);
            
            // 5. Ubicación (selector)
            var ubicacion = this.$el.find('#select-ubicacion').val();
            var ubicacionColor = 'Rojo';
            if (ubicacion === 'Ubicación atractiva') ubicacionColor = 'Verde';
            else if (ubicacion === 'Ubicación medianamente atractiva') ubicacionColor = 'Amarillo';
            else if (ubicacion === 'Ubicación no atractiva') ubicacionColor = 'Rojo';
            items.push({ nombre: 'Ubicación', valor: ubicacionColor });
            console.log('  📊 Ubicación:', ubicacion, '→', ubicacionColor);
            
            // APLICAR FÓRMULA
            var verdes = 0;
            var amarillos = 0;
            var rojos = 0;
            
            items.forEach(function(item) {
                if (item.valor === 'Verde') verdes++;
                else if (item.valor === 'Amarillo') amarillos++;
                else if (item.valor === 'Rojo') rojos++;
            });
            
            console.log('  🔢 Conteo: Verde=' + verdes + ', Amarillo=' + amarillos + ', Rojo=' + rojos);
            
            var estatusFinal = 'Rojo'; // Por defecto
            
            // Aplicar reglas
            if (rojos >= 2) {
                estatusFinal = 'Rojo';
                console.log('  ✓ Regla: 2+ rojos → Rojo');
            } else if (rojos === 1) {
                estatusFinal = 'Amarillo';
                console.log('  ✓ Regla: 1 rojo → Amarillo');
            } else if (amarillos >= 2) {
                estatusFinal = 'Amarillo';
                console.log('  ✓ Regla: 2+ amarillos → Amarillo');
            } else if (amarillos === 1 && verdes === 4) {
                estatusFinal = 'Verde';
                console.log('  ✓ Regla: 1 amarillo + 4 verdes → Verde');
            } else if (verdes === 5) {
                estatusFinal = 'Verde';
                console.log('  ✓ Regla: 5 verdes → Verde');
            } else {
                console.log('  ⚠️ Sin regla específica, usando Rojo por defecto');
            }
            
            console.log('  🎯 ESTATUS FINAL:', estatusFinal);
            
            this.estatusPropiedad = estatusFinal;
            return estatusFinal;
        },

        obtenerEstadoDeSelect: function (campo) {
            var valor = this.$el.find('#select-' + campo).val();
            return this.obtenerColorClassPorValor(campo, valor) === 'select-verde' ? 'Verde' :
                   this.obtenerColorClassPorValor(campo, valor) === 'select-amarillo' ? 'Amarillo' : 'Rojo';
        },

        // ========== OTROS MÉTODOS ==========

        mostrarModalCrearRecaudo: function (tipo) {
            if (this.modalCrearRecaudo) {
                this.modalCrearRecaudo.mostrar(tipo);
            }
        },

        mostrarInfoRecaudoModal: function (e) {
            var infoTexto = $(e.currentTarget).data('info');
            var recaudoTexto = $(e.currentTarget).data('recaudo-texto');
            
            if (!infoTexto) return;

            var modalId = 'infoRecaudoModal';
            var $modal = $('#' + modalId);
            
            if ($modal.length === 0) {
                var modalHtml = 
                    '<div class="modal fade" id="' + modalId + '" tabindex="-1" role="dialog">' +
                    '  <div class="modal-dialog modal-lg">' +
                    '    <div class="modal-content">' +
                    '      <div class="modal-header">' +
                    '        <button type="button" class="close" data-dismiss="modal">&times;</button>' +
                    '        <h4 class="modal-title"><i class="fas fa-info-circle"></i> Información del Recaudo</h4>' +
                    '      </div>' +
                    '      <div class="modal-body">' +
                    '        <h5>Recaudo:</h5><p class="info-recaudo-texto"></p>' +
                    '        <h5>Descripción:</h5><div class="info-contenido-texto"></div>' +
                    '      </div>' +
                    '      <div class="modal-footer">' +
                    '        <button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>' +
                    '      </div>' +
                    '    </div>' +
                    '  </div>' +
                    '</div>';
                
                $('body').append(modalHtml);
                $modal = $('#' + modalId);
            }
            
            $modal.find('.info-recaudo-texto').text(recaudoTexto);
            $modal.find('.info-contenido-texto').html(infoTexto.replace(/\n/g, '<br>'));
            $modal.modal('show');
        },

        inicializarTooltipsRecaudos: function () {
            this.$el.find('[data-toggle="tooltip"]').tooltip({
                placement: 'top',
                html: true,
                container: 'body',
                trigger: 'hover'
            });
        },

        guardarInventario: function () {
            if (!this.inventarioId) {
                Espo.Ui.error('No hay inventario para guardar');
                return;
            }
            
            var tipoPersona = this.$el.find('#tipoPersona').val();
            var tieneApoderado = this.$el.find('input[name="apoderado"]:checked').val() === 'true';
            
            // Calcular estatus antes de guardar
            var estatusPropiedad = this.calcularEstatusPropiedad();
            
            var data = {
                inventarioId: this.inventarioId,
                tipoPersona: tipoPersona,
                buyer: this.$el.find('#buyerPersona').val(),
                buyerPersona: this.$el.find('#buyerPersona').val(),
                subBuyers: this.obtenerSubBuyersSeleccionados(),
                apoderado: tieneApoderado,
                valoresRecaudosLegal: this.valoresRecaudosLegal,
                valoresRecaudosMercadeo: this.valoresRecaudosMercadeo,
                valoresRecaudosApoderado: this.valoresRecaudosApoderado,
                recaudosLegal: this.obtenerRecaudosSeleccionados('legal'),
                recaudosMercadeo: this.obtenerRecaudosSeleccionados('mercadeo'),
                recaudosApoderado: this.obtenerRecaudosSeleccionados('apoderado'),
                demanda: this.$el.find('#select-demanda').val(),
                precio: this.$el.find('#select-precio').val(),
                ubicacion: this.$el.find('#select-ubicacion').val(),
                exclusividad: this.$el.find('#select-exclusividad').val(),
                estatusPropiedad: estatusPropiedad // IMPORTANTE: Enviar el calculado
            };
            
            console.log('📤 Guardando con estatusPropiedad:', estatusPropiedad);
            console.log('📤 Datos completos:', data);
            
            var $btnGuardar = this.$el.find('[data-action="guardar"]');
            var textoOriginal = $btnGuardar.html();
            $btnGuardar.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');
            
            var self = this;
            
            Espo.Ajax.postRequest('InvPropiedades/action/save', data)
                .then(function (response) {
                    if (response.success) {
                        Espo.Ui.success('Inventario guardado exitosamente');
                        
                        // CAMBIO: Recargar en lugar de redirigir
                        setTimeout(function () {
                            console.log('🔄 Recargando página...');
                            window.location.reload();
                        }, 1000);
                    } else {
                        Espo.Ui.error(response.error || 'Error al guardar');
                        $btnGuardar.prop('disabled', false).html(textoOriginal);
                    }
                })
                .catch(function (error) {
                    console.error('Error en Ajax save:', error);
                    Espo.Ui.error('Error al guardar inventario');
                    $btnGuardar.prop('disabled', false).html(textoOriginal);
                });
        },

        obtenerRecaudosSeleccionados: function (campoId) {
            var lista = this.obtenerListaActual(campoId);
            var recaudos = [];
            
            lista.mostrados.forEach(function(recaudo) {
                var estado = campoId === 'legal' ? this.valoresRecaudosLegal[recaudo.id] :
                            campoId === 'mercadeo' ? this.valoresRecaudosMercadeo[recaudo.id] :
                            this.valoresRecaudosApoderado[recaudo.id];
                
                recaudos.push({
                    recaudoId: recaudo.id,
                    estado: estado || 'Modificar/No Tiene'
                });
            }.bind(this));
            
            console.log('📋 Recaudos ' + campoId + ':', recaudos);
            
            return recaudos;
        },

        escapeHtml: function (text) {
            if (!text) return '';
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
        },

        data: function () {
            return {};
        }
    });
});