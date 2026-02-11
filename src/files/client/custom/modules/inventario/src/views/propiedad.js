define('inventario:views/propiedad', [
    'view',
    'inventario:views/modules/semaforo',
    'inventario:views/modules/subbuyer',
    'inventario:views/modules/calculadora-notas',
    'inventario:views/modules/recaudos-dinamicos',
    'inventario:views/modules/modal-crear-recaudo'
], function (Dep, SemaforoManager, SubBuyerManager, CalculadoraNotas, RecaudosDinamicosManager, ModalCrearRecaudoManager) {
    
    return Dep.extend({
        
        template: 'inventario:propiedad',

        setup: function () {
            Dep.prototype.setup.call(this);
            
            console.log('=== propiedad.js - setup() ===');
            
            this.propiedadId = this.options.propiedadId;
            
            if (!this.propiedadId) {
                console.error('❌ NO HAY propiedadId');
                Espo.Ui.error('ID de propiedad no proporcionado');
                this.getRouter().navigate('#InvLista', { trigger: true });
                return;
            }
            
            console.log('✅ propiedadId OK:', this.propiedadId);
            
            this.inventarioId = null;
            this.inventarioData = null;
            this.propiedadData = null;

            this.agregandoRecaudo = false;
            
            // Asegurar que listasRecaudos siempre esté inicializado
            this.initializeListasRecaudos();
            
            // Listas de recaudos por tipo
            this.listasRecaudos = {
                // Legal tiene dos conjuntos separados: Natural y Juridico
                legal: {
                    natural: {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    },
                    juridico: {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    },
                    // Tipo actual seleccionado
                    tipoActual: 'natural'
                },
                // Mercadeo y Apoderado son independientes
                mercadeo: {
                    mostrados: [],
                    disponibles: [],
                    esPorDefecto: false
                },
                apoderado: {
                    mostrados: [],
                    disponibles: [],
                    esPorDefecto: false
                }
            };
            
            // Inicializar módulos
            this.semaforoManager = new SemaforoManager(this);
            this.subBuyerManager = new SubBuyerManager(this);
            this.calculadoraNotas = new CalculadoraNotas(this);
            this.recaudosDinamicosManager = new RecaudosDinamicosManager(this);
            this.modalCrearRecaudo = new ModalCrearRecaudoManager(this);
            
            // Variables para almacenar valores de recaudos
            this.valoresRecaudosLegal = {};
            this.valoresRecaudosMercadeo = {};
            this.valoresRecaudosApoderado = {};
            
            // Cargar datos
            this.cargarDatos();
        },

        initializeListasRecaudos: function () {
            this.listasRecaudos = {
                legal: {
                    natural: {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    },
                    juridico: {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    },
                    tipoActual: 'natural'
                },
                mercadeo: {
                    mostrados: [],
                    disponibles: [],
                    esPorDefecto: false
                },
                apoderado: {
                    mostrados: [],
                    disponibles: [],
                    esPorDefecto: false
                }
            };
        },

        getListaRecaudosActual: function (tipo) {
            if (tipo === 'legal') {
                var tipoPersona = this.$el.find('#tipoPersona').val().toLowerCase();
                this.listasRecaudos.legal.tipoActual = tipoPersona;
                return this.listasRecaudos.legal[tipoPersona];
            }
            return this.listasRecaudos[tipo];
        },

        // En afterRender, después de cargar datos:
        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.setupEventListeners();
            
            // Inicializar porcentajes
            if (this.calculadoraNotas) {
                this.calculadoraNotas.inicializarPorcentajes();
            }
            
            // Inicializar modal
            if (this.modalCrearRecaudo) {
                this.modalCrearRecaudo.inicializar();
            }
            
            // Inicializar estados del panel "Otros"
            this.actualizarEstadosOtros();
            this.actualizarEstadosHeaderOtros();
            
            // Depurar después de cargar
            setTimeout(function() {
                console.log('🕒 Depuración después de cargar (3 segundos):');
                this.depurarListas();
            }.bind(this), 3000);
        },

        setupEventListeners: function () {
            var self = this;
            
            // Toggle panels - CORREGIDO: usar delegación
            this.$el.on('click', '[data-action="toggle-panel"]', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.togglePanel($(this).closest('.panel-heading')[0]);
            });

            // Volver
            this.$el.on('click', '[data-action="volver"]', function () {
                self.getRouter().navigate('#InvLista', { trigger: true });
            });

            // Cancelar
            this.$el.on('click', '[data-action="cancelar"]', function () {
                self.getRouter().navigate('#InvLista', { trigger: true });
            });

            // Guardar
            this.$el.on('click', '[data-action="guardar"]', function () {
                self.guardarInventario();
            });

            // Apoderado radio change
            this.$el.on('change', 'input[name="apoderado"]', function (e) {
                var valor = $(e.currentTarget).val();
                var mostrar = valor === 'true';
                
                self.mostrarObligaciones(mostrar);
                
                if (mostrar) {
                    // Si se selecciona "Sí", cargar los recaudos si no están cargados
                    if (self.listasRecaudos.apoderado.mostrados.length === 0 && 
                        self.listasRecaudos.apoderado.disponibles.length === 0) {
                        
                        self.cargarYMostrarRecaudosApoderado();
                    } else {
                        // Si ya están cargados, solo actualizar la vista
                        self.actualizarVistaRecaudos('apoderado');
                        self.actualizarDropdownRecaudos('apoderado', self.listasRecaudos.apoderado.disponibles);
                    }
                    
                    // Calcular porcentaje
                    self.calcularPorcentajeApoderado();
                } else {
                    self.$el.find('#nota-apoderado').text('0%');
                }
            });

            // Cambio en tipo de persona (Natural/Jurídico)
            this.$el.on('change', '#tipoPersona', function (e) {
                var tipo = $(e.target).val();
                
                // Cargar recaudos legales según tipo de persona
                self.cargarYMostrarRecaudosLegales(tipo);
                
                // Calcular notas
                if (self.calculadoraNotas) {
                    self.calculadoraNotas.calcularNotas();
                }
            });

            // Cambio en buyer persona para cargar sub buyers
            this.$el.on('change', '#buyerPersona', function (e) {
                var buyerSeleccionado = $(e.target).val();
                if (self.subBuyerManager) {
                    self.subBuyerManager.cargarSubBuyers(buyerSeleccionado);
                }
            });

            // Setup de módulos
            if (this.semaforoManager) {
                this.semaforoManager.setupEventListeners();
            }

            this.$el.on('click', '[data-action="depurar"]', function () {
                self.depurarListas();
            });
            
            if (this.subBuyerManager) {
                this.subBuyerManager.setupEventListeners();
            }
            
            // Event listeners delegados para recaudos
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
                
                var $target = $(e.currentTarget);
                var recaudoId = $target.data('recaudo-id');
                var campoId = $target.data('campo-id');
                var tipoPersona = self.$el.find('#tipoPersona').val().toLowerCase();
                
                if (!confirm('¿Está seguro de que desea eliminar este elemento?')) {
                    return;
                }
                
                self.eliminarRecaudo(campoId, recaudoId, tipoPersona);
            });
            
            // Event listener para agregar recaudos
            this.$el.on('click', '.btn-agregar-recaudo', function (e) {
                e.preventDefault();
                
                var $button = $(e.currentTarget);
                var tipo = $button.data('tipo');
                var $select = self.$el.find('#select-agregar-' + tipo);
                var recaudoId = $select.val();
                var tipoPersona = self.$el.find('#tipoPersona').val().toLowerCase();
                
                if (!recaudoId) {
                    Espo.Ui.warning('Por favor seleccione un elemento para agregar');
                    return;
                }
                
                if (recaudoId === 'crear_nuevo') {
                    self.mostrarModalCrearRecaudo(tipo);
                    $select.val('');
                } else {
                    self.agregarRecaudo(tipo, recaudoId, tipoPersona);
                    $select.val('');
                }
            });
            
            // Event listener para selección de semáforo en panel "Otros"
            this.$el.on('click', '[data-action="selectSemaforo"]', function (e) {
                self.seleccionarSemaforoOtros(e);
            });
            
            // Cambio en dropdowns para crear nuevo recaudo
            this.$el.on('change', '#select-agregar-legal, #select-agregar-mercadeo, #select-agregar-apoderado', function (e) {
                var valor = $(e.target).val();
                if (valor === 'crear_nuevo') {
                    var tipo = $(e.target).attr('id').replace('select-agregar-', '');
                    self.mostrarModalCrearRecaudo(tipo);
                    $(e.target).val(''); // Resetear selección
                }
            });
            
            // Escuchar evento de recaudo creado
            $(document).on('recaudoCreado', function (e, data) {
                self.onRecaudoCreado(data);
            });
        },

        cargarYMostrarRecaudosMercadeo: function () {
            var self = this;
            var $contenedor = this.$el.find('#contenedor-recaudos-mercadeo');
            
            $contenedor.html('<div class="text-center" style="padding: 20px;"><div class="spinner-small"></div><p>Cargando elementos de mercadeo...</p></div>');
            
            return this.cargarRecaudosPorTipo('mercadeo', 'Mercadeo')
                .then(function (resultado) {
                    console.log('Recaudos mercadeo cargados:', resultado.mostrados.length, 'disponibles:', resultado.disponibles.length);
                    
                    // Actualizar lista
                    self.listasRecaudos.mercadeo.mostrados = resultado.mostrados;
                    self.listasRecaudos.mercadeo.disponibles = resultado.disponibles;
                    self.listasRecaudos.mercadeo.esPorDefecto = resultado.esPorDefecto;
                    
                    // Actualizar vista
                    if (resultado.mostrados.length === 0) {
                        $contenedor.html('<div class="alert alert-info">No hay elementos de mercadeo</div>');
                    } else {
                        var html = self.crearHTMLRecaudos(
                            resultado.mostrados, 
                            'mercadeo', 
                            resultado.esPorDefecto
                        );
                        $contenedor.html(html);
                        
                        // Inicializar tooltips
                        self.inicializarTooltipsRecaudos();
                        
                        // Inicializar valores
                        resultado.mostrados.forEach(function(recaudo) {
                            self.valoresRecaudosMercadeo[recaudo.id] = recaudo.estado || 'Modificar';
                        });
                    }
                    
                    // Actualizar dropdown
                    self.actualizarDropdownRecaudos('mercadeo', resultado.disponibles);
                    
                    return resultado;
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos de mercadeo:', error);
                    $contenedor.html('<div class="alert alert-danger">Error al cargar elementos de mercadeo</div>');
                    // Devolver un resultado vacío para que la promesa se resuelva
                    return {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    };
                });
        },

        cargarYMostrarRecaudosApoderado: function () {
            var self = this;
            var $contenedor = this.$el.find('#contenedor-recaudos-apoderado');
            
            $contenedor.html('<div class="text-center" style="padding: 20px;"><div class="spinner-small"></div><p>Cargando requisitos de apoderado...</p></div>');
            
            // Si ya tenemos los datos, usarlos
            if (this.listasRecaudos.apoderado.mostrados.length > 0 || 
                this.listasRecaudos.apoderado.disponibles.length > 0) {
                
                console.log('Usando recaudos de apoderado ya cargados');
                this.actualizarVistaRecaudos('apoderado');
                this.actualizarDropdownRecaudos('apoderado', this.listasRecaudos.apoderado.disponibles);
                this.calcularPorcentajeApoderado();
                return Promise.resolve(this.listasRecaudos.apoderado);
            }
            
            // Si no, cargarlos del servidor
            return this.cargarRecaudosPorTipo('apoderado', 'Apoderado')
                .then(function (resultado) {
                    console.log('Recaudos apoderado cargados:', resultado.mostrados.length, 'disponibles:', resultado.disponibles.length);
                    
                    // Actualizar lista
                    self.listasRecaudos.apoderado.mostrados = resultado.mostrados;
                    self.listasRecaudos.apoderado.disponibles = resultado.disponibles;
                    self.listasRecaudos.apoderado.esPorDefecto = resultado.esPorDefecto;
                    
                    // Actualizar vista
                    if (resultado.mostrados.length === 0) {
                        $contenedor.html('<div class="alert alert-info">No hay requisitos de apoderado</div>');
                    } else {
                        var html = self.crearHTMLRecaudos(
                            resultado.mostrados, 
                            'apoderado', 
                            resultado.esPorDefecto
                        );
                        $contenedor.html(html);
                        
                        // Inicializar tooltips
                        self.inicializarTooltipsRecaudos();
                        
                        // Inicializar valores
                        resultado.mostrados.forEach(function(recaudo) {
                            self.valoresRecaudosApoderado[recaudo.id] = recaudo.estado || 'Modificar';
                        });
                    }
                    
                    // Actualizar dropdown
                    self.actualizarDropdownRecaudos('apoderado', resultado.disponibles);
                    
                    // Calcular porcentaje
                    self.calcularPorcentajeApoderado();
                    
                    return resultado;
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos de apoderado:', error);
                    $contenedor.html('<div class="alert alert-danger">Error al cargar requisitos de apoderado</div>');
                    // Devolver un resultado vacío para que la promesa se resuelva
                    return {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    };
                });
        },

        cargarRecaudosPorTipo: function (tipo, tipoBackend) {
            var self = this;
            
            console.log('Cargando recaudos para tipo:', tipo, 'tipoBackend:', tipoBackend);
            
            return new Promise(function (resolve, reject) {
                // Para legal, el tipoBackend es el tipo de persona específico
                var tipoParam = tipoBackend;
                
                // Primero, obtener los recaudos ya guardados para esta propiedad
                Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosGuardados', {
                    propiedadId: self.propiedadId,
                    tipo: tipoParam
                })
                .then(function (response) {
                    if (response.success && response.data) {
                        var recaudosGuardados = response.data.recaudos || [];
                        var esPorDefecto = response.data.esPorDefecto || false;
                        
                        console.log('Recaudos guardados para', tipoParam, ':', recaudosGuardados.length, 'Es por defecto:', esPorDefecto);
                        
                        // Determinar dónde guardar
                        var listaDestino;
                        if (tipo === 'legal') {
                            // Para legal, guardar según tipo de persona
                            var tipoPersona = tipoBackend.toLowerCase();
                            self.listasRecaudos.legal[tipoPersona] = {
                                mostrados: recaudosGuardados,
                                disponibles: [],
                                esPorDefecto: esPorDefecto
                            };
                            listaDestino = self.listasRecaudos.legal[tipoPersona];
                        } else {
                            // Para mercadeo y apoderado
                            self.listasRecaudos[tipo].mostrados = recaudosGuardados;
                            self.listasRecaudos[tipo].esPorDefecto = esPorDefecto;
                            listaDestino = self.listasRecaudos[tipo];
                        }
                        
                        // Ahora cargar TODOS los recaudos de este tipo para el dropdown
                        return Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosByTipo', {
                            tipo: tipoParam
                        })
                        .then(function (response) {
                            if (response.success && response.data) {
                                var todosRecaudos = response.data;
                                var recaudosMostradosIds = listaDestino.mostrados.map(function(r) {
                                    return r.id;
                                });
                                
                                // Filtrar: disponibles = todos - mostrados
                                var recaudosDisponibles = todosRecaudos.filter(function(recaudo) {
                                    return !recaudosMostradosIds.includes(recaudo.id);
                                });
                                
                                listaDestino.disponibles = recaudosDisponibles;
                                
                                console.log('Recaudos disponibles para', tipoParam, ':', recaudosDisponibles.length);
                                
                                resolve({
                                    mostrados: listaDestino.mostrados,
                                    disponibles: recaudosDisponibles,
                                    esPorDefecto: listaDestino.esPorDefecto,
                                    tipoEspecifico: tipoParam
                                });
                            } else {
                                throw new Error('Error obteniendo todos los recaudos');
                            }
                        });
                    } else {
                        throw new Error('Error obteniendo recaudos guardados');
                    }
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos para', tipo, ':', error);
                    reject(error);
                });
            });
        },

        togglePanel: function (element) {
            console.log('togglePanel llamado');
            var self = this;  // ¡IMPORTANTE! Guardar referencia a this
            var $heading = $(element);
            var $panel = $heading.closest('.panel');
            var $body = $panel.find('.panel-body');
            var $icon = $heading.find('.fa-chevron-down, .fa-chevron-up');
            var panelText = $heading.text().toLowerCase();
            
            console.log('Body visible?', $body.is(':visible'));
            
            if ($body.is(':visible')) {
                $body.slideUp(200);
                $icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            } else {
                $body.slideDown(200);
                $icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
                
                // Si es el panel de apoderado y no hemos cargado los recaudos, cargarlos
                if (panelText.includes('apoderado')) {
                    setTimeout(function() {
                        // Verificar si ya tenemos datos
                        if (self.listasRecaudos && self.listasRecaudos.apoderado && 
                            self.listasRecaudos.apoderado.disponibles.length === 0) {
                            
                            self.cargarRecaudosApoderadoParaDropdown();
                        } else if (self.listasRecaudos && self.listasRecaudos.apoderado) {
                            // Si ya tenemos datos, solo actualizar el dropdown
                            self.actualizarDropdownRecaudos('apoderado', self.listasRecaudos.apoderado.disponibles);
                        }
                    }, 300);
                }
            }
        },

        mostrarObligaciones: function (mostrar) {
            var $contenedorRecaudos = this.$el.find('#contenedor-recaudos-apoderado');
            var $panelAgregar = this.$el.find('#panel-agregar-apoderado');
            
            if (mostrar) {
                $contenedorRecaudos.slideDown(200);
                
                // Mostrar panel para agregar
                if ($panelAgregar.length > 0) {
                    $panelAgregar.slideDown(200);
                    
                    // Si el dropdown está vacío, actualizarlo
                    var $select = $('#select-agregar-apoderado');
                    if ($select.find('option').length <= 2) { // Solo tiene las opciones por defecto
                        this.actualizarDropdownRecaudos('apoderado', this.listasRecaudos.apoderado.disponibles);
                    }
                }
            } else {
                $contenedorRecaudos.slideUp(200);
                if ($panelAgregar.length > 0) {
                    $panelAgregar.slideUp(200);
                }
            }
        },

        cargarDatos: function () {
            var self = this;
            
            console.log('=== cargarDatos() llamado ===');
            console.log('propiedadId a enviar:', this.propiedadId);
            
            Espo.Ajax.getRequest('InvPropiedades/action/getOrCreate', {
                propiedadId: this.propiedadId
            })
                .then(function (response) {
                    console.log('✅ Respuesta de getOrCreate:', response);
                    
                    if (response.success) {
                        self.inventarioData = response.data.inventario;
                        self.propiedadData = response.data.propiedad;
                        self.inventarioId = self.inventarioData.id;
                        
                        console.log('Datos cargados correctamente');
                        console.log('inventarioId:', self.inventarioId);
                        
                        // Mostrar datos
                        self.mostrarDatos();
                    } else {
                        console.error('❌ Response con success=false:', response);
                        // Ocultar loader y mostrar error
                        self.$el.find('#loading-container').hide();
                        Espo.Ui.error(response.error || 'Error al cargar datos');
                        self.getRouter().navigate('#InvLista', { trigger: true });
                    }
                })
                .catch(function (error) {
                    console.error('❌ Error en Ajax:', error);
                    // Ocultar loader y mostrar error
                    self.$el.find('#loading-container').hide();
                    Espo.Ui.error('Error al cargar datos de la propiedad');
                    self.getRouter().navigate('#InvLista', { trigger: true });
                });
        },

        mostrarDatos: function () {
            console.log('=== mostrarDatos() ===');
            
            try {
                // Ocultar loader y mostrar formulario
                this.$el.find('#loading-container').hide();
                this.$el.find('#form-container').show();
                
                // Panel 1: Información de la propiedad
                this.$el.find('#prop-tipoOperacion').text(this.propiedadData.tipoOperacion || '-');
                this.$el.find('#prop-tipoPropiedad').text(this.propiedadData.tipoPropiedad || '-');
                this.$el.find('#prop-subTipoPropiedad').text(this.propiedadData.subTipoPropiedad || '-');
                this.$el.find('#prop-m2C').text(this.propiedadData.m2C ? this.propiedadData.m2C + ' m²' : '-');
                this.$el.find('#prop-m2T').text(this.propiedadData.m2T ? this.propiedadData.m2T + ' m²' : '-');
                
                // Ubicación ya decodificada en el backend
                this.$el.find('#prop-ubicacion').text(this.propiedadData.ubicacion || '-');
                
                this.$el.find('#prop-asesor').text(this.propiedadData.asesorNombre || '-');
                
                if (this.propiedadData.fechaAlta) {
                    var fecha = new Date(this.propiedadData.fechaAlta);
                    this.$el.find('#prop-fechaAlta').text(fecha.toLocaleDateString('es-ES'));
                } else {
                    this.$el.find('#prop-fechaAlta').text('-');
                }
                
                var $statusBadge = this.$el.find('#prop-status');
                $statusBadge.text(this.propiedadData.status || '-');
                
                // Colores del status
                var statusColors = {
                    'Disponible': '#27ae60',
                    'Reservada': '#f39c12',
                    'Vendida': '#e74c3c',
                    'Rentada': '#3498db',
                    'Retirada': '#95a5a6',
                    'En promocion': '#27ae60'
                };
                var color = statusColors[this.propiedadData.status] || '#95a5a6';
                $statusBadge.css({
                    'background-color': color,
                    'color': 'white'
                });
                
                // Panel 2: Requisitos legales
                var tipoPersona = this.inventarioData.tipoPersona || 'Natural';
                this.$el.find('#tipoPersona').val(tipoPersona);
                
                // Cargar recaudos legales
                this.cargarYMostrarRecaudosLegales(tipoPersona);
                
                // Panel 3: Mercadeo
                var buyerPersona = this.inventarioData.buyerPersona || this.inventarioData.buyer || 'Comprador';
                this.$el.find('#buyerPersona').val(buyerPersona);
                
                // Cargar recaudos de mercadeo
                this.cargarYMostrarRecaudosMercadeo();
                
                // Cargar sub buyers según buyer seleccionado
                var subBuyerInicial = this.inventarioData.subBuyerPersona || this.inventarioData.subBuyer || '';
                if (this.subBuyerManager) {
                    this.subBuyerManager.inicializar();
                    this.subBuyerManager.setValorInicial(subBuyerInicial);
                }
                
                // Panel 4: Apoderado
                var apoderado = this.inventarioData.apoderado || false;
                if (apoderado) {
                    this.$el.find('input[name="apoderado"][value="true"]').prop('checked', true);
                    this.mostrarObligaciones(true);
                    // Cargar recaudos de apoderado
                    this.cargarYMostrarRecaudosApoderado();
                    // Calcular porcentaje inicial
                    this.calcularPorcentajeApoderado();
                } else {
                    this.$el.find('input[name="apoderado"][value="false"]').prop('checked', true);
                    this.mostrarObligaciones(false);
                    this.$el.find('#nota-apoderado').text('0%');
                    
                    // PERO: cargar los recaudos de apoderado igual para tenerlos disponibles
                    // Solo que no los mostraremos
                    this.cargarRecaudosApoderadoParaDropdown();
                }
                
                // Panel 5: Otros - Inicializar semáforos
                if (this.semaforoManager) {
                    this.semaforoManager.inicializarTodosLosCampos(this.inventarioData);
                    this.actualizarEstadosOtros();
                    this.actualizarEstadosHeaderOtros();
                }
                
                // Calcular notas iniciales
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
                
                // Si hay datos guardados de recaudos, actualizar estados
                if (this.inventarioData.valoresRecaudosLegal) {
                    Object.keys(this.inventarioData.valoresRecaudosLegal).forEach(function(recaudoId) {
                        var $input = this.$el.find('#recaudo_' + recaudoId + '_legal');
                        if ($input.length) {
                            $input.val(this.inventarioData.valoresRecaudosLegal[recaudoId]);
                            // También seleccionar visualmente el color correspondiente
                            var valor = this.inventarioData.valoresRecaudosLegal[recaudoId];
                            var $colorOption = this.$el.find('[data-recaudo-id="' + recaudoId + '"][data-campo-id="legal"][data-valor="' + valor + '"]');
                            if ($colorOption.length) {
                                $colorOption.addClass('selected');
                            }
                        }
                    }.bind(this));
                }
                
                if (this.inventarioData.valoresRecaudosMercadeo) {
                    Object.keys(this.inventarioData.valoresRecaudosMercadeo).forEach(function(recaudoId) {
                        var $input = this.$el.find('#recaudo_' + recaudoId + '_mercadeo');
                        if ($input.length) {
                            $input.val(this.inventarioData.valoresRecaudosMercadeo[recaudoId]);
                            // También seleccionar visualmente el color correspondiente
                            var valor = this.inventarioData.valoresRecaudosMercadeo[recaudoId];
                            var $colorOption = this.$el.find('[data-recaudo-id="' + recaudoId + '"][data-campo-id="mercadeo"][data-valor="' + valor + '"]');
                            if ($colorOption.length) {
                                $colorOption.addClass('selected');
                            }
                        }
                    }.bind(this));
                }
                
                if (this.inventarioData.valoresRecaudosApoderado) {
                    Object.keys(this.inventarioData.valoresRecaudosApoderado).forEach(function(recaudoId) {
                        var $input = this.$el.find('#recaudo_' + recaudoId + '_apoderado');
                        if ($input.length) {
                            $input.val(this.inventarioData.valoresRecaudosApoderado[recaudoId]);
                            // También seleccionar visualmente el color correspondiente
                            var valor = this.inventarioData.valoresRecaudosApoderado[recaudoId];
                            var $colorOption = this.$el.find('[data-recaudo-id="' + recaudoId + '"][data-campo-id="apoderado"][data-valor="' + valor + '"]');
                            if ($colorOption.length) {
                                $colorOption.addClass('selected');
                            }
                        }
                    }.bind(this));
                    
                    // Recalcular porcentaje de apoderado
                    this.calcularPorcentajeApoderado();
                }
                
                console.log('✅ Datos mostrados en UI');
            } catch (error) {
            console.error('❌ Error en mostrarDatos:', error);
            // Aún así ocultar el loader y mostrar algún error
            this.$el.find('#loading-container').hide();
            this.$el.find('#form-container').show();
            Espo.Ui.error('Error al cargar los datos. Por favor, recarga la página.');
            }
        },

        cargarRecaudosApoderadoParaDropdown: function () {
            var self = this;
            
            console.log('Cargando recaudos de apoderado para dropdown...');
            
            this.cargarRecaudosPorTipo('apoderado', 'Apoderado')
                .then(function (resultado) {
                    console.log('Recaudos apoderado cargados para dropdown:', resultado.mostrados.length, 'disponibles:', resultado.disponibles.length);
                    
                    // Guardar en la lista (pero no mostrar)
                    self.listasRecaudos.apoderado.mostrados = resultado.mostrados;
                    self.listasRecaudos.apoderado.disponibles = resultado.disponibles;
                    self.listasRecaudos.apoderado.esPorDefecto = resultado.esPorDefecto;
                    
                    // Solo actualizar dropdown si está visible
                    if (self.$el.find('#panel-agregar-apoderado').is(':visible')) {
                        self.actualizarDropdownRecaudos('apoderado', resultado.disponibles);
                    }
                    
                    // Inicializar valores
                    resultado.mostrados.forEach(function(recaudo) {
                        self.valoresRecaudosApoderado[recaudo.id] = recaudo.estado || 'Modificar';
                    });
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos de apoderado para dropdown:', error);
                });
        },

        cargarYMostrarRecaudosLegales: function (tipoPersona) {
            var self = this;
            var $contenedor = this.$el.find('#contenedor-recaudos-legal');
            
            $contenedor.html('<div class="text-center" style="padding: 20px;"><div class="spinner-small"></div><p>Cargando requisitos legales...</p></div>');
            
            return this.cargarRecaudosPorTipo('legal', tipoPersona)
                .then(function (resultado) {
                    console.log('Recaudos legales cargados:', resultado.mostrados.length, 'disponibles:', resultado.disponibles.length);
                    
                    // Actualizar lista
                    var tipoPersonaLower = tipoPersona.toLowerCase();
                    self.listasRecaudos.legal[tipoPersonaLower] = {
                        mostrados: resultado.mostrados,
                        disponibles: resultado.disponibles,
                        esPorDefecto: resultado.esPorDefecto
                    };
                    self.listasRecaudos.legal.tipoActual = tipoPersonaLower;
                    
                    // Actualizar vista
                    if (resultado.mostrados.length === 0) {
                        $contenedor.html('<div class="alert alert-info">No hay requisitos legales para ' + tipoPersona + '</div>');
                    } else {
                        var html = self.crearHTMLRecaudos(
                            resultado.mostrados, 
                            'legal', 
                            resultado.esPorDefecto
                        );
                        $contenedor.html(html);
                        
                        // Inicializar tooltips
                        self.inicializarTooltipsRecaudos();
                        
                        // Inicializar valores
                        resultado.mostrados.forEach(function(recaudo) {
                            self.valoresRecaudosLegal[recaudo.id] = recaudo.estado || 'Modificar';
                        });
                    }
                    
                    // Actualizar dropdown
                    self.actualizarDropdownRecaudos('legal', resultado.disponibles, tipoPersona);
                    
                    return resultado;
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos legales:', error);
                    $contenedor.html('<div class="alert alert-danger">Error al cargar requisitos legales</div>');
                    // Devolver un resultado vacío para que la promesa se resuelva
                    return {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    };
                });
        },

        // Método para actualizar vista de recaudos legales
        actualizarVistaRecaudosLegales: function (tipoPersona, lista) {
            console.log('🔄 actualizarVistaRecaudosLegales para', tipoPersona, 'mostrados:', lista.mostrados.length);
            
            var $contenedor = this.$el.find('#contenedor-recaudos-legal');
            
            if (lista.mostrados.length === 0) {
                $contenedor.html('<div class="alert alert-info">No hay requisitos legales para ' + tipoPersona + '</div>');
            } else {
                var html = this.crearHTMLRecaudos(lista.mostrados, 'legal', lista.esPorDefecto);
                $contenedor.html(html);
                
                // Inicializar tooltips
                this.inicializarTooltipsRecaudos();
                
                // Inicializar valores
                var self = this;
                lista.mostrados.forEach(function(recaudo) {
                    var inputId = 'recaudo_' + recaudo.id + '_legal';
                    if (self.$el.find('#' + inputId).length === 0) {
                        $contenedor.append('<input type="hidden" id="' + inputId + '" value="' + (recaudo.estado || 'Modificar') + '">');
                    }
                    self.valoresRecaudosLegal[recaudo.id] = recaudo.estado || 'Modificar';
                });
            }
            
            console.log('✅ Vista de legal actualizada');
        },



        // Métodos para cargar recaudos
        cargarRecaudosLegal: function (tipoPersona) {
            var self = this;
            
            console.log('Cargando recaudos legales para tipo persona:', tipoPersona);
            
            // Ocultar contenedor y mostrar spinner
            var $contenedor = this.$el.find('#contenedor-recaudos-legal');
            $contenedor.html('<div class="text-center" style="padding: 20px;"><div class="spinner-small"></div><p>Cargando requisitos legales...</p></div>');
            
            // Usar el nuevo endpoint
            Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosGuardados', {
                propiedadId: this.propiedadId,
                tipo: 'legal'
            })
            .then(function (response) {
                if (response.success && response.data) {
                    var recaudos = response.data.recaudos;
                    var esPorDefecto = response.data.esPorDefecto;
                    
                    console.log('Recaudos cargados:', recaudos.length, 'Es por defecto:', esPorDefecto);
                    
                    if (recaudos.length === 0) {
                        $contenedor.html('<div class="alert alert-info">No hay requisitos legales disponibles</div>');
                    } else {
                        // Filtrar por tipo de persona seleccionado
                        var recaudosFiltrados = recaudos.filter(function(recaudo) {
                            return recaudo.tipo === tipoPersona;
                        });
                        
                        if (recaudosFiltrados.length === 0) {
                            $contenedor.html('<div class="alert alert-info">No hay requisitos legales para ' + tipoPersona + '</div>');
                        } else {
                            // Crear HTML para los recaudos
                            var html = self.crearHTMLRecaudos(recaudosFiltrados, 'legal', esPorDefecto);
                            $contenedor.html(html);
                            
                            // Inicializar tooltips
                            self.inicializarTooltipsRecaudos();
                            
                            // Inicializar valores guardados
                            self.inicializarValoresRecaudosGuardados('legal', recaudosFiltrados);
                        }
                    }
                    
                    // Cargar recaudos disponibles para agregar (NO por defecto que no estén ya en la lista)
                    self.cargarRecaudosDisponiblesParaAgregar('legal', tipoPersona);
                    
                } else {
                    $contenedor.html('<div class="alert alert-danger">Error al cargar requisitos legales</div>');
                }
            })
            .catch(function (error) {
                console.error('Error cargando recaudos legales:', error);
                $contenedor.html('<div class="alert alert-danger">Error al cargar requisitos legales</div>');
            });
        },

        crearHTMLRecaudos: function (recaudos, campoId, esPorDefecto) {
            var self = this;
            var html = '';
            
            if (!recaudos || recaudos.length === 0) {
                return esPorDefecto ? 
                    '<div class="alert alert-info">No hay recaudos por defecto disponibles</div>' :
                    '<div class="alert alert-info">No hay recaudos disponibles</div>';
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
                // Asegurar que el ID sea string
                var recaudoId = String(recaudo.id || recaudo.recaudoId);
                var recaudoName = recaudo.name || recaudo.nombre;
                var recaudoDesc = recaudo.descripcion || '';
                
                html += '<tr class="recaudo-row" data-recaudo-id="' + recaudoId + '">';
                html += '<td>';
                html += '<div class="recaudo-texto-container">';
                
                // Icono de información si hay descripción
                if (recaudoDesc && recaudoDesc.trim() !== '') {
                    html += '<span class="recaudo-icon-space">';
                    html += '<i class="fas fa-info-circle info-icon" ';
                    html += 'data-action="showInfoRecaudo" ';
                    html += 'data-toggle="tooltip" ';
                    html += 'data-html="true" ';
                    html += 'data-info="' + self.escapeHtml(recaudoDesc) + '" ';
                    html += 'data-recaudo-texto="' + self.escapeHtml(recaudoName) + '" ';
                    html += 'title="<small>Click para ver información completa</small>"></i>';
                    html += '</span>';
                } else {
                    html += '<span class="recaudo-icon-space"></span>';
                }
                
                html += '<h4>' + self.escapeHtml(recaudoName) + '</h4>';
                
                // Indicador si es por defecto
                if (esPorDefecto && recaudo.default) {
                    html += '<span class="badge badge-default" style="margin-left: 10px; background-color: #6c757d; color: white; font-size: 10px;">Por defecto</span>';
                }
                
                html += '</div>';
                html += '</td>';
                
                // Opciones de semáforo
                html += '<td>';
                html += '<div class="color-option color-verde" ';
                html += 'data-action="selectRecaudoSemaforo" ';
                html += 'data-recaudo-id="' + recaudoId + '" ';
                html += 'data-campo-id="' + campoId + '" ';
                html += 'data-valor="Adecuado">';
                html += '</div>';
                html += '</td>';
                
                html += '<td>';
                html += '<div class="color-option color-amarillo" ';
                html += 'data-action="selectRecaudoSemaforo" ';
                html += 'data-recaudo-id="' + recaudoId + '" ';
                html += 'data-campo-id="' + campoId + '" ';
                html += 'data-valor="Revisar">';
                html += '</div>';
                html += '</td>';
                
                html += '<td>';
                html += '<div class="color-option color-rojo" ';
                html += 'data-action="selectRecaudoSemaforo" ';
                html += 'data-recaudo-id="' + recaudoId + '" ';
                html += 'data-campo-id="' + campoId + '" ';
                html += 'data-valor="Modificar">';
                html += '</div>';
                html += '</td>';
                
                // Botón para eliminar - SIEMPRE visible
                html += '<td>';
                html += '<button class="btn-eliminar-recaudo" ';
                html += 'data-action="eliminarRecaudo" ';
                html += 'data-recaudo-id="' + recaudoId + '" ';
                html += 'data-campo-id="' + campoId + '" ';
                html += 'title="Eliminar este recaudo">';
                html += '<i class="fas fa-minus-circle"></i>';
                html += '</button>';
                html += '</td>';
                
                html += '</tr>';
                // NOTA: NO crear el input hidden aquí
                
            });
            
            html += '</tbody>';
            html += '</table>';
            html += '</div>';
            
            return html;
        },

        // Método para cargar recaudos disponibles para agregar
        cargarRecaudosDisponiblesParaAgregar: function (campoId, tipoPersona) {
            var self = this;
            
            // Obtener tipo backend
            var tipoBackend = '';
            if (campoId === 'legal') {
                tipoBackend = tipoPersona;
            } else if (campoId === 'mercadeo') {
                tipoBackend = 'Mercadeo';
            } else if (campoId === 'apoderado') {
                tipoBackend = 'Apoderado';
            }
            
            // Cargar todos los recaudos de este tipo
            Espo.Ajax.getRequest('InvRecaudos/action/getRecaudosByTipo', {
                tipo: tipoBackend
            })
            .then(function (response) {
                if (response.success && response.data) {
                    var todosRecaudos = response.data;
                    
                    // Obtener IDs de recaudos ya mostrados
                    var recaudosMostradosIds = [];
                    self.$el.find('#contenedor-recaudos-' + campoId + ' .recaudo-row').each(function() {
                        recaudosMostradosIds.push($(this).data('recaudo-id'));
                    });
                    
                    // Filtrar recaudos que no están ya mostrados
                    var recaudosDisponibles = todosRecaudos.filter(function(recaudo) {
                        return !recaudosMostradosIds.includes(recaudo.id);
                    });
                    
                    // Actualizar el dropdown
                    self.actualizarDropdownAgregarRecaudos(campoId, recaudosDisponibles);
                }
            })
            .catch(function (error) {
                console.error('Error cargando recaudos disponibles:', error);
            });
        },

        cargarRecaudosMercadeo: function () {
            var self = this;
            
            // Primero cargar recaudos por defecto
            this.recaudosDinamicosManager.cargarRecaudosPorTipo('Mercadeo', true)
                .then(function (recaudosDefault) {
                    var htmlDefault = self.recaudosDinamicosManager.crearHTMLRecaudos(recaudosDefault, 'mercadeo', true);
                    
                    // Luego cargar recaudos NO por defecto para el dropdown
                    return self.recaudosDinamicosManager.cargarRecaudosPorTipo('Mercadeo', false)
                        .then(function (recaudosNoDefault) {
                            var html = htmlDefault;
                            
                            // Agregar recaudos que ya estaban agregados (de guardados anteriores)
                            if (self.inventarioData.valoresRecaudosMercadeo) {
                                // Aquí procesaríamos los recaudos guardados anteriormente
                            }
                            
                            self.$el.find('#contenedor-recaudos-mercadeo').html(html);
                            
                            // Cargar el select para agregar nuevos recaudos
                            self.recaudosDinamicosManager.cargarSelectAgregarRecaudos('Mercadeo', 'mercadeo');
                            
                            // Inicializar tooltips
                            self.inicializarTooltipsRecaudos();
                            
                            // Inicializar valores guardados si existen
                            self.inicializarValoresRecaudosGuardados('mercadeo');
                        });
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos de mercadeo:', error);
                    self.$el.find('#contenedor-recaudos-mercadeo').html(
                        '<div class="alert alert-danger">Error al cargar elementos de mercadeo</div>'
                    );
                });
        },

        cargarRecaudosApoderado: function () {
            var self = this;
            
            // Primero cargar recaudos por defecto
            this.recaudosDinamicosManager.cargarRecaudosPorTipo('Apoderado', true)
                .then(function (recaudosDefault) {
                    var htmlDefault = self.recaudosDinamicosManager.crearHTMLRecaudos(recaudosDefault, 'apoderado', true);
                    
                    // Luego cargar recaudos NO por defecto para el dropdown
                    return self.recaudosDinamicosManager.cargarRecaudosPorTipo('Apoderado', false)
                        .then(function (recaudosNoDefault) {
                            var html = htmlDefault;
                            
                            // Agregar recaudos que ya estaban agregados (de guardados anteriores)
                            if (self.inventarioData.valoresRecaudosApoderado) {
                                // Aquí procesaríamos los recaudos guardados anteriormente
                            }
                            
                            self.$el.find('#contenedor-recaudos-apoderado').html(html);
                            
                            // Cargar el select para agregar nuevos recaudos
                            self.recaudosDinamicosManager.cargarSelectAgregarRecaudos('Apoderado', 'apoderado');
                            
                            // Inicializar tooltips
                            self.inicializarTooltipsRecaudos();
                            
                            // Inicializar valores guardados si existen
                            self.inicializarValoresRecaudosGuardados('apoderado');
                            
                            // Calcular porcentaje inicial
                            self.calcularPorcentajeApoderado();
                        });
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos de apoderado:', error);
                    self.$el.find('#contenedor-recaudos-apoderado').html(
                        '<div class="alert alert-danger">Error al cargar requisitos de apoderado</div>'
                    );
                });
        },

        // Método para actualizar el dropdown
        actualizarDropdownAgregarRecaudos: function (campoId, recaudosDisponibles) {
            var $select = this.$el.find('#select-agregar-' + campoId);
            
            if ($select.length === 0) {
                console.error('Select no encontrado para:', campoId);
                return;
            }
            
            $select.empty();
            $select.append('<option value="">Seleccione un elemento para agregar</option>');
            
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
            this.$el.find('#panel-agregar-' + campoId).show();
        },

        seleccionarRecaudoSemaforo: function (e) {
            var $target = $(e.currentTarget);
            var recaudoId = $target.data('recaudo-id');
            var campoId = $target.data('campo-id');
            var valor = $target.data('valor');
            
            // Deseleccionar todas las opciones para este recaudo
            this.$el.find('[data-recaudo-id="' + recaudoId + '"][data-campo-id="' + campoId + '"]')
                .removeClass('selected');
            
            // Seleccionar la opción clickeada
            $target.addClass('selected');
            
            // Actualizar el valor en el input hidden
            var inputId = 'recaudo_' + recaudoId + '_' + campoId;
            this.$el.find('#' + inputId).val(valor);
            
            // Actualizar en el objeto correspondiente
            if (campoId === 'legal') {
                this.valoresRecaudosLegal[recaudoId] = valor;
                // Recalcular nota legal
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
            } else if (campoId === 'mercadeo') {
                this.valoresRecaudosMercadeo[recaudoId] = valor;
                // Recalcular nota de mercadeo
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
            } else if (campoId === 'apoderado') {
                this.valoresRecaudosApoderado[recaudoId] = valor;
                // Calcular porcentaje de apoderado
                this.calcularPorcentajeApoderado();
            }
        },

        seleccionarSemaforoOtros: function (e) {
            var $target = $(e.currentTarget);
            var campo = $target.data('campo');
            var valor = $target.data('valor');
            
            // Primero manejar la selección normal
            if (this.semaforoManager) {
                // Encontrar el elemento clickeado
                var $elemento = $target;
                this.semaforoManager.seleccionarSemaforo({
                    currentTarget: $elemento[0]
                });
            }
            
            // Actualizar el estado visual en la columna "Estado"
            this.actualizarEstadoCampo(campo, valor);
            
            // Actualizar el header del panel "Otros"
            this.actualizarEstadoHeaderCampo(campo, valor);
        },

        actualizarEstadoCampo: function (campo, valor) {
            var $estadoBadge = this.$el.find('#estado-' + campo + ' .estado-badge');
            var texto = '';
            var clase = '';
            
            switch(valor) {
                case 'Modificar':
                case 'No exclusividad':
                case 'Debajo del rango':
                case 'Baja demanda':
                    texto = 'Modificar';
                    clase = 'estado-modificar';
                    break;
                case 'Revisar':
                case 'Exclusividad interna de CENTURY con contrato firmado':
                case 'Sobre el rango':
                case 'Media demanda':
                    texto = 'Revisar';
                    clase = 'estado-revisar';
                    break;
                case 'Adecuado':
                case 'Exclusividad pura o total con contrato firmado':
                case 'En rango':
                case 'Alta demanda':
                    texto = 'Adecuado';
                    clase = 'estado-adecuado';
                    break;
                default:
                    texto = 'Pendiente';
                    clase = 'estado-pendiente';
            }
            
            $estadoBadge
                .removeClass('estado-modificar estado-revisar estado-adecuado estado-pendiente')
                .addClass(clase)
                .text(texto);
        },

        actualizarEstadoHeaderCampo: function (campo, valor) {
            var estado = this.obtenerEstadoDeValor(valor);
            var color = this.obtenerColorEstado(estado);
            
            var $indicator = this.$el.find('#status-' + campo);
            
            // Remover todas las clases de estado
            $indicator.removeClass('modificar revisar adecuado pendiente');
            
            // Agregar la clase correspondiente
            $indicator.addClass(estado.toLowerCase());
            
            // Actualizar color del borde/fondo según sea necesario
            $indicator.css({
                'border-color': color,
                'background-color': color + '20' // Color con transparencia
            });
        },

        actualizarEstadosHeaderOtros: function () {
            var campos = ['exclusividad', 'precio', 'ubicacion', 'demanda'];
            
            campos.forEach(function (campo) {
                var valor = this.$el.find('#' + campo).val();
                if (valor) {
                    this.actualizarEstadoHeaderCampo(campo, valor);
                }
            }.bind(this));
        },

        actualizarEstadosOtros: function () {
            var self = this;
            var campos = ['exclusividad', 'precio', 'ubicacion', 'demanda'];
            
            campos.forEach(function (campo) {
                var valor = self.$el.find('#' + campo).val();
                if (valor) {
                    self.actualizarEstadoCampo(campo, valor);
                }
            });
        },

        obtenerEstadoDeValor: function (valor) {
            switch(valor) {
                case 'Modificar':
                case 'No exclusividad':
                case 'Debajo del rango':
                case 'Baja demanda':
                    return 'Modificar';
                case 'Revisar':
                case 'Exclusividad interna de CENTURY con contrato firmado':
                case 'Sobre el rango':
                case 'Media demanda':
                    return 'Revisar';
                case 'Adecuado':
                case 'Exclusividad pura o total con contrato firmado':
                case 'En rango':
                case 'Alta demanda':
                    return 'Adecuado';
                default:
                    return 'Pendiente';
            }
        },

        obtenerColorEstado: function (estado) {
            switch(estado) {
                case 'Modificar': return '#e74c3c';
                case 'Revisar': return '#f39c12';
                case 'Adecuado': return '#27ae60';
                default: return '#95a5a6';
            }
        },

        calcularPorcentajeApoderado: function () {
            var totalRecaudos = 0;
            var completosRecaudos = 0;
            
            // Contar recaudos en el contenedor
            var $filas = this.$el.find('#contenedor-recaudos-apoderado .recaudo-row');
            totalRecaudos = $filas.length;
            
            if (totalRecaudos === 0) {
                this.$el.find('#nota-apoderado').text('0%');
                return;
            }
            
            // Contar cuántos están marcados como "Adecuado"
            var self = this;
            $filas.each(function () {
                var recaudoId = $(this).data('recaudo-id');
                var valor = self.$el.find('#recaudo_' + recaudoId + '_apoderado').val();
                if (valor === 'Adecuado') {
                    completosRecaudos++;
                }
            });
            
            var porcentaje = Math.round((completosRecaudos / totalRecaudos) * 100);
            this.$el.find('#nota-apoderado').text(porcentaje + '%');
        },

        eliminarRecaudo: function (campoId, recaudoId, tipoPersona) {
            console.log('🔴 ========== ELIMINAR RECAUDO INICIO ==========');
            console.log('Campo:', campoId, 'RecaudoID:', recaudoId, 'TipoPersona:', tipoPersona);
            
            // Depurar ANTES de eliminar
            console.log('📊 Estado ANTES de eliminar:');
            this.depurarListas();

            var self = this;
            
            // Convertir recaudoId a string para comparación consistente
            recaudoId = String(recaudoId);
            
            console.log('🔴 Intentando eliminar recaudo ID:', recaudoId, 'de', campoId);
            
            // Determinar lista correcta
            var lista;
            if (campoId === 'legal') {
                tipoPersona = tipoPersona || this.$el.find('#tipoPersona').val().toLowerCase();
                lista = this.listasRecaudos.legal[tipoPersona];
                if (!lista) {
                    console.error('❌ Lista no encontrada para legal', tipoPersona);
                    return;
                }
            } else {
                lista = this.listasRecaudos[campoId];
            }
            
            if (!lista) {
                console.error('❌ Lista no encontrada para:', campoId);
                return;
            }
            
            console.log('📊 Estado de la lista antes de eliminar:');
            console.log('Mostrados:', lista.mostrados.map(r => r.id + ' - ' + r.name));
            console.log('Disponibles:', lista.disponibles.map(r => r.id + ' - ' + r.name));
            
            // Buscar el recaudo en mostrados (comparando como strings)
            var recaudoIndex = lista.mostrados.findIndex(function(r) {
                return String(r.id) === recaudoId;
            });
            
            if (recaudoIndex === -1) {
                console.warn('⚠️ Recaudo no encontrado en mostrados:', recaudoId);
                Espo.Ui.warning('Este recaudo no está en la lista visible');
                return;
            }
            
            // Mover de mostrados a disponibles
            var recaudo = lista.mostrados[recaudoIndex];
            lista.mostrados.splice(recaudoIndex, 1);
            
            // Verificar que no esté ya en disponibles
            var existeEnDisponibles = lista.disponibles.some(function(r) {
                return String(r.id) === recaudoId;
            });
            
            if (!existeEnDisponibles) {
                lista.disponibles.push(recaudo);
                console.log('✅ Recaudo movido a disponibles');
            } else {
                console.log('ℹ️ Recaudo ya estaba en disponibles, no se duplica');
            }
            
            // Eliminar valor guardado
            if (campoId === 'legal') {
                delete this.valoresRecaudosLegal[recaudoId];
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
            } else if (campoId === 'mercadeo') {
                delete this.valoresRecaudosMercadeo[recaudoId];
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
            } else if (campoId === 'apoderado') {
                delete this.valoresRecaudosApoderado[recaudoId];
                this.calcularPorcentajeApoderado();
            }
            
            // Actualizar la vista
            if (campoId === 'legal') {
                this.actualizarVistaRecaudosLegales(tipoPersona, lista);
            } else {
                this.actualizarVistaRecaudos(campoId);
            }
            
            // Ahora, para actualizar el dropdown correctamente, necesitamos recargar
            // todos los recaudos disponibles del servidor
            var tipoBackend = campoId === 'legal' ? 
                            (tipoPersona === 'natural' ? 'Natural' : 'Juridico') :
                            campoId === 'mercadeo' ? 'Mercadeo' : 'Apoderado';
            
            Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosByTipo', {
                tipo: tipoBackend
            })
            .then(function (response) {
                if (response.success && response.data) {
                    var todosRecaudos = response.data;
                    
                    // Filtrar los que están en mostrados
                    var recaudosMostradosIds = lista.mostrados.map(function(r) {
                        return String(r.id);
                    });
                    
                    var recaudosDisponibles = todosRecaudos.filter(function(recaudo) {
                        return !recaudosMostradosIds.includes(String(recaudo.id));
                    });
                    
                    // Actualizar la lista de disponibles
                    lista.disponibles = recaudosDisponibles;
                    
                    // Actualizar dropdown en la UI
                    self.actualizarDropdownRecaudos(campoId, recaudosDisponibles, tipoPersona);
                    
                    console.log('🔄 Dropdown actualizado después de eliminar');
                    console.log('Nuevos disponibles:', recaudosDisponibles.length);
                    
                    Espo.Ui.success('Recaudo eliminado de la lista');
                }
            })
            .catch(function (error) {
                console.error('Error actualizando dropdown después de eliminar:', error);
                // Si falla, al menos actualizar con lo que tenemos
                self.actualizarDropdownRecaudos(campoId, lista.disponibles, tipoPersona);
                Espo.Ui.success('Recaudo eliminado de la lista');
            });
            console.log('📊 Estado DESPUÉS de eliminar:');
            this.depurarListas();
            console.log('🔴 ========== ELIMINAR RECAUDO FIN ==========');
        },

        agregarRecaudo: function (campoId, recaudoId, tipoPersona) {
            var self = this;
            
            // Convertir a string para consistencia
            recaudoId = String(recaudoId);
            
            console.log('🟢 Agregando recaudo:', {campoId, recaudoId, tipoPersona});
            
            // Determinar lista correcta
            var lista;
            if (campoId === 'legal') {
                tipoPersona = tipoPersona || this.$el.find('#tipoPersona').val().toLowerCase();
                lista = this.listasRecaudos.legal[tipoPersona];
                if (!lista) {
                    console.error('Lista no encontrada para legal', tipoPersona);
                    return;
                }
            } else {
                lista = this.listasRecaudos[campoId];
            }
            
            if (!lista) {
                console.error('Lista no encontrada para:', campoId);
                Espo.Ui.error('Error interno: lista no encontrada');
                return;
            }
            
            // Verificar si ya está en mostrados
            var yaEnMostrados = lista.mostrados.some(function(r) {
                return String(r.id) === recaudoId;
            });
            
            if (yaEnMostrados) {
                console.log('Recaudo ya está en mostrados:', recaudoId);
                Espo.Ui.warning('Este recaudo ya está en la lista');
                return;
            }
            
            // Buscar el recaudo en disponibles
            var recaudoIndex = lista.disponibles.findIndex(function(r) {
                return String(r.id) === recaudoId;
            });
            
            if (recaudoIndex === -1) {
                console.error('Recaudo no encontrado en disponibles:', recaudoId);
                Espo.Ui.warning('Recaudo no disponible o ya está en la lista');
                return;
            }
            
            // Mover de disponibles a mostrados
            var recaudo = lista.disponibles[recaudoIndex];
            lista.disponibles.splice(recaudoIndex, 1);
            lista.mostrados.push(recaudo);
            
            // Marcar que ya no es por defecto
            lista.esPorDefecto = false;
            
            // Actualizar la vista
            if (campoId === 'legal') {
                this.actualizarVistaRecaudosLegales(tipoPersona, lista);
            } else {
                this.actualizarVistaRecaudos(campoId);
            }
            
            // Actualizar dropdown
            this.actualizarDropdownRecaudos(campoId, lista.disponibles, tipoPersona);
            
            Espo.Ui.success('Recaudo agregado correctamente');
        },

        actualizarDropdownRecaudos: function (campoId, recaudosDisponibles, tipoPersona) {
            console.log('🔄 actualizarDropdownRecaudos llamado para', campoId, 'con', recaudosDisponibles.length, 'disponibles');
            
            var $select = this.$el.find('#select-agregar-' + campoId);
            var $panel = this.$el.find('#panel-agregar-' + campoId);
            
            if ($select.length === 0) {
                console.log('Select no existe aún para:', campoId);
                return;
            }
            
            // Limpiar y reconstruir completamente
            $select.empty();
            $select.append('<option value="">Seleccione un elemento para agregar</option>');
            
            if (!recaudosDisponibles || recaudosDisponibles.length === 0) {
                $select.append('<option value="" disabled>No hay elementos disponibles para agregar</option>');
            } else {
                recaudosDisponibles.forEach(function (recaudo) {
                    $select.append('<option value="' + recaudo.id + '">' + recaudo.name + '</option>');
                });
            }
            
            // Siempre agregar opción para crear nuevo
            $select.append('<option value="crear_nuevo">+ Crear nuevo requisito</option>');
            
            // Mostrar el panel
            $panel.show();
            
            console.log('✅ Dropdown actualizado, opciones:', $select.find('option').length);
        },

        // Método para eliminar recaudo
        eliminarRecaudo: function (campoId, recaudoId, tipoPersona) {
            var self = this;
            
            // Determinar lista correcta
            var lista;
            if (campoId === 'legal') {
                tipoPersona = tipoPersona || this.$el.find('#tipoPersona').val().toLowerCase();
                lista = this.listasRecaudos.legal[tipoPersona];
                if (!lista) return;
            } else {
                lista = this.listasRecaudos[campoId];
            }
            
            // Buscar el recaudo en mostrados
            var recaudoIndex = lista.mostrados.findIndex(function(r) {
                return r.id == recaudoId;
            });
            
            if (recaudoIndex === -1) {
                console.error('Recaudo no encontrado en mostrados:', recaudoId);
                return;
            }
            
            // Mover de mostrados a disponibles
            var recaudo = lista.mostrados[recaudoIndex];
            lista.mostrados.splice(recaudoIndex, 1);
            lista.disponibles.push(recaudo);
            
            // Eliminar valor guardado
            if (campoId === 'legal') {
                delete this.valoresRecaudosLegal[recaudoId];
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
            } else if (campoId === 'mercadeo') {
                delete this.valoresRecaudosMercadeo[recaudoId];
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
            } else if (campoId === 'apoderado') {
                delete this.valoresRecaudosApoderado[recaudoId];
                this.calcularPorcentajeApoderado();
            }
            
            // Actualizar la vista
            if (campoId === 'legal') {
                this.actualizarVistaRecaudosLegales(tipoPersona, lista);
            } else {
                this.actualizarVistaRecaudos(campoId);
            }
            
            // Actualizar dropdown
            this.actualizarDropdownRecaudos(campoId, lista.disponibles, tipoPersona);
            
            Espo.Ui.success('Recaudo eliminado de la lista');
        },

        // Actualizar vista de recaudos
        actualizarVistaRecaudos: function (tipo) {
            var self = this;
            var $contenedor = this.$el.find('#contenedor-recaudos-' + tipo);
            
            if (tipo === 'legal') {
                // Para legal, usar el método específico
                var tipoPersona = this.$el.find('#tipoPersona').val().toLowerCase();
                var lista = this.listasRecaudos.legal[tipoPersona];
                if (lista) {
                    this.actualizarVistaRecaudosLegales(tipoPersona, lista);
                }
                return;
            }
            
            var lista = this.listasRecaudos[tipo];
            
            if (!lista || lista.mostrados.length === 0) {
                $contenedor.html('<div class="alert alert-info">No hay recaudos para mostrar</div>');
            } else {
                // Limpiar inputs hidden duplicados
                $contenedor.find('input[type="hidden"]').remove();
                
                var html = this.crearHTMLRecaudos(
                    lista.mostrados, 
                    tipo, 
                    lista.esPorDefecto
                );
                $contenedor.html(html);
                
                // Inicializar tooltips
                this.inicializarTooltipsRecaudos();
                
                // Crear inputs hidden para cada recaudo
                lista.mostrados.forEach(function(recaudo) {
                    var inputId = 'recaudo_' + recaudo.id + '_' + tipo;
                    var $existingInput = self.$el.find('#' + inputId);
                    
                    if ($existingInput.length === 0) {
                        // Crear input hidden si no existe
                        self.$el.find('#contenedor-recaudos-' + tipo).append(
                            '<input type="hidden" id="' + inputId + '" value="' + (recaudo.estado || 'Modificar') + '">'
                        );
                    }
                });
            }
        },

        agregarRecaudoSeleccionado: function (e) {
            var $button = $(e.currentTarget);
            var tipo = $button.data('tipo');
            var $select = this.$el.find('#select-agregar-' + tipo);
            var recaudoId = $select.val();
            
            if (!recaudoId) {
                Espo.Ui.warning('Por favor seleccione un elemento para agregar');
                return;
            }
            
            // Agregar al manager
            this.recaudosDinamicosManager.agregarRecaudo(recaudoId, tipo);
            
            // Limpiar selección
            $select.val('');
            
            Espo.Ui.success('Elemento agregado correctamente');
        },

        // Modal para crear nuevo recaudo
        mostrarModalCrearRecaudo: function (tipo) {
            if (this.modalCrearRecaudo) {
                this.modalCrearRecaudo.mostrar(tipo);
            } else {
                console.error('ModalCrearRecaudo no está inicializado');
            }
        },

        // Agrega este método a la clase
        depurarListas: function() {
            console.log('🔍 ========== DEPURACIÓN DE LISTAS ==========');
            
            console.log('📋 LISTA LEGAL - NATURAL:');
            if (this.listasRecaudos.legal.natural) {
                console.log('- Mostrados:', this.listasRecaudos.legal.natural.mostrados.map(r => `${r.id}:${r.name}`));
                console.log('- Disponibles:', this.listasRecaudos.legal.natural.disponibles.map(r => `${r.id}:${r.name}`));
            } else {
                console.log('- No existe lista para natural');
            }
            
            console.log('📋 LISTA LEGAL - JURIDICO:');
            if (this.listasRecaudos.legal.juridico) {
                console.log('- Mostrados:', this.listasRecaudos.legal.juridico.mostrados.map(r => `${r.id}:${r.name}`));
                console.log('- Disponibles:', this.listasRecaudos.legal.juridico.disponibles.map(r => `${r.id}:${r.name}`));
            } else {
                console.log('- No existe lista para juridico');
            }
            
            console.log('📋 LISTA MERCADEO:');
            console.log('- Mostrados:', this.listasRecaudos.mercadeo.mostrados.map(r => `${r.id}:${r.name}`));
            console.log('- Disponibles:', this.listasRecaudos.mercadeo.disponibles.map(r => `${r.id}:${r.name}`));
            
            console.log('📋 LISTA APODERADO:');
            console.log('- Mostrados:', this.listasRecaudos.apoderado.mostrados.map(r => `${r.id}:${r.name}`));
            console.log('- Disponibles:', this.listasRecaudos.apoderado.disponibles.map(r => `${r.id}:${r.name}`));
            
            console.log('🔍 ========== FIN DEPURACIÓN ==========');
        },

        onRecaudoCreado: function (data) {
            console.log('🔵 ========== onRecaudoCreado INICIO ==========');
            console.log('Datos recibidos:', data);
            
            var tipo = data.tipo;
            var recaudoId = data.recaudoId;
            var recaudoNombre = data.recaudoNombre;
            var recaudoTipo = data.recaudoTipo;
            
            console.log('Tipo frontend:', tipo);
            console.log('Recaudo ID:', recaudoId);
            console.log('Recaudo nombre:', recaudoNombre);
            console.log('Recaudo tipo backend:', recaudoTipo);
            
            // PASO 1: Determinar lista correcta
            var lista;
            var tipoPersona = null;
            
            if (tipo === 'legal') {
                tipoPersona = this.$el.find('#tipoPersona').val().toLowerCase();
                console.log('Tipo persona para legal:', tipoPersona);
                
                // Asegurar que exista la lista
                if (!this.listasRecaudos.legal[tipoPersona]) {
                    console.log('Creando nueva lista para legal', tipoPersona);
                    this.listasRecaudos.legal[tipoPersona] = {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    };
                }
                lista = this.listasRecaudos.legal[tipoPersona];
            } else {
                console.log('Accediendo a lista para:', tipo);
                lista = this.listasRecaudos[tipo];
                
                // Asegurar que exista la lista
                if (!lista) {
                    console.log('Creando nueva lista para', tipo);
                    this.listasRecaudos[tipo] = {
                        mostrados: [],
                        disponibles: [],
                        esPorDefecto: false
                    };
                    lista = this.listasRecaudos[tipo];
                }
            }
            
            if (!lista) {
                console.error('❌ ERROR CRÍTICO: Lista no encontrada');
                return;
            }
            
            console.log('📊 Estado ANTES de agregar:');
            console.log('- Mostrados:', lista.mostrados.map(r => `${r.id}:${r.name}`));
            console.log('- Disponibles:', lista.disponibles.map(r => `${r.id}:${r.name}`));
            
            // PASO 2: Verificar si ya existe (usando string para comparación)
            var idString = String(recaudoId);
            var existeEnMostrados = lista.mostrados.some(r => String(r.id) === idString);
            var existeEnDisponibles = lista.disponibles.some(r => String(r.id) === idString);
            
            console.log('Verificación existencia:');
            console.log('- En mostrados?', existeEnMostrados);
            console.log('- En disponibles?', existeEnDisponibles);
            
            if (existeEnMostrados) {
                console.log('⚠️ Recaudo ya está en mostrados, no se agregará');
                return;
            }
            
            // PASO 3: Si existe en disponibles, eliminarlo
            if (existeEnDisponibles) {
                console.log('🗑️ Eliminando de disponibles (duplicado)...');
                var index = lista.disponibles.findIndex(r => String(r.id) === idString);
                if (index !== -1) {
                    lista.disponibles.splice(index, 1);
                }
            }
            
            // PASO 4: Crear y AGREGAR a mostrados
            var nuevoRecaudo = {
                id: recaudoId,
                name: recaudoNombre,
                descripcion: '',
                default: false,
                tipo: recaudoTipo,
                estado: 'Modificar'
            };
            
            console.log('➕ Agregando recaudo a mostrados:', nuevoRecaudo);
            lista.mostrados.push(nuevoRecaudo);
            lista.esPorDefecto = false;
            
            console.log('📊 Estado DESPUÉS de agregar:');
            console.log('- Mostrados AHORA:', lista.mostrados.map(r => `${r.id}:${r.name}`));
            console.log('- Disponibles AHORA:', lista.disponibles.map(r => `${r.id}:${r.name}`));
            
            // PASO 5: Actualizar la vista INMEDIATAMENTE
            console.log('🔄 Actualizando vista...');
            if (tipo === 'legal') {
                this.actualizarVistaRecaudosLegales(tipoPersona, lista);
            } else {
                this.actualizarVistaRecaudos(tipo);
            }
            
            // PASO 6: ACTUALIZAR DROPDOWN - ¡CRÍTICO!
            console.log('🔄 Actualizando dropdown...');
            console.log('ANTES de actualizar dropdown - disponibles:', lista.disponibles.length);
            
            // Forzar actualización del dropdown
            var $select = this.$el.find('#select-agregar-' + tipo);
            if ($select.length > 0) {
                console.log('Select encontrado, actualizando...');
                
                // Limpiar y reconstruir el dropdown
                $select.empty();
                $select.append('<option value="">Seleccione un elemento para agregar</option>');
                
                if (lista.disponibles.length === 0) {
                    $select.append('<option value="" disabled>No hay elementos disponibles para agregar</option>');
                } else {
                    lista.disponibles.forEach(function(recaudo) {
                        $select.append('<option value="' + recaudo.id + '">' + recaudo.name + '</option>');
                    });
                }
                
                // Siempre agregar opción para crear nuevo
                $select.append('<option value="crear_nuevo">+ Crear nuevo requisito</option>');
                
                console.log('Dropdown actualizado con', lista.disponibles.length, 'opciones');
            } else {
                console.warn('Select NO encontrado para:', tipo);
            }
            
            // PASO 7: VERIFICACIÓN FINAL
            console.log('✅ VERIFICACIÓN FINAL:');
            console.log('- ¿Recaudo en mostrados?', lista.mostrados.some(r => String(r.id) === idString));
            console.log('- ¿Recaudo en disponibles?', lista.disponibles.some(r => String(r.id) === idString));
            
            Espo.Ui.success('Recaudo creado y agregado a la lista');
            console.log('🔵 ========== onRecaudoCreado FIN ==========');
        },

        inicializarTooltipsRecaudos: function () {
            this.$el.find('[data-toggle="tooltip"]').tooltip({
                placement: 'top',
                html: true,
                container: 'body',
                trigger: 'hover'
            });
        },

        inicializarValoresRecaudosGuardados: function (campoId) {
            // Aquí inicializaríamos los valores desde this.inventarioData
            // Por ahora, todos inician como "Modificar"
            var $inputs = this.$el.find('input[id^="recaudo_"][id$="_' + campoId + '"]');
            
            $inputs.each(function () {
                // TODO: Cargar valores guardados del inventario
                // Por defecto, todos son "Modificar"
            });
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
                    '  <div class="modal-dialog modal-lg" role="document">' +
                    '    <div class="modal-content">' +
                    '      <div class="modal-header">' +
                    '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                    '          <span aria-hidden="true">&times;</span>' +
                    '        </button>' +
                    '        <h4 class="modal-title"><i class="fas fa-info-circle"></i> Información del Recaudo</h4>' +
                    '      </div>' +
                    '      <div class="modal-body">' +
                    '        <div class="info-recaudo-container">' +
                    '          <h5 class="info-recaudo-titulo">Recaudo:</h5>' +
                    '          <p class="info-recaudo-texto"></p>' +
                    '        </div>' +
                    '        <div class="info-contenido-container">' +
                    '          <h5 class="info-contenido-titulo">Descripción:</h5>' +
                    '          <div class="info-contenido-texto"></div>' +
                    '        </div>' +
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

        guardarInventario: function () {
            if (!this.inventarioId) {
                Espo.Ui.error('No hay inventario para guardar');
                return;
            }
            
            // Obtener valores según tipo de persona
            var tipoPersona = this.$el.find('#tipoPersona').val();
            
            // Obtener valores de semáforos
            var valoresSemaforos = {};
            if (this.semaforoManager) {
                valoresSemaforos = this.semaforoManager.getValoresCampos();
            }
            
            // Obtener sub buyer seleccionado
            var subBuyerSeleccionado = '';
            if (this.subBuyerManager) {
                subBuyerSeleccionado = this.subBuyerManager.getSubBuyerSeleccionado();
            }
            
            // Obtener nota de mercadeo
            var notaMercadeo = 'Modificar';
            if (this.calculadoraNotas) {
                notaMercadeo = this.calculadoraNotas.getNotaMercadeo();
            }
            
            // Calcular nota legal basada en recaudos
            var notaLegal = this.calcularNotaLegal();
            
            // Calcular porcentaje de apoderado
            var porcentajeApoderado = this.$el.find('#nota-apoderado').text();
            var tieneApoderado = this.$el.find('input[name="apoderado"]:checked').val() === 'true';
            
            // Recopilar datos del formulario
            var data = {
                inventarioId: this.inventarioId,
                tipoPersona: tipoPersona,
                buyerPersona: this.$el.find('#buyerPersona').val(),
                subBuyerPersona: subBuyerSeleccionado,
                apoderado: tieneApoderado,
                notaLegal: notaLegal,
                notaMercadeo: notaMercadeo,
                notaApoderado: porcentajeApoderado,
                // Agregar valores de recaudos
                valoresRecaudosLegal: this.valoresRecaudosLegal,
                valoresRecaudosMercadeo: this.valoresRecaudosMercadeo,
                valoresRecaudosApoderado: this.valoresRecaudosApoderado,
                // Lista de recaudos agregados (no por defecto)
                recaudosAgregadosLegal: this.recaudosDinamicosManager.recaudosAgregados.legal,
                recaudosAgregadosMercadeo: this.recaudosDinamicosManager.recaudosAgregados.mercadeo,
                recaudosAgregadosApoderado: this.recaudosDinamicosManager.recaudosAgregados.apoderado,
                recaudosLegal: this.obtenerRecaudosSeleccionados('legal'),
                recaudosMercadeo: this.obtenerRecaudosSeleccionados('mercadeo'),
                recaudosApoderado: this.obtenerRecaudosSeleccionados('apoderado')
            };
            
            // Agregar valores de semáforos del panel Otros
            if (valoresSemaforos.demanda) data.demanda = valoresSemaforos.demanda;
            if (valoresSemaforos.precio) {
                data.precio = valoresSemaforos.precio;
                data.notaPrecio = valoresSemaforos.precio;
            }
            if (valoresSemaforos.ubicacion) {
                data.ubicacion = valoresSemaforos.ubicacion;
                data.notaUbicacion = valoresSemaforos.ubicacion;
            }
            if (valoresSemaforos.exclusividad) {
                data.exclusividad = valoresSemaforos.exclusividad;
                data.notaExclusiva = valoresSemaforos.exclusividad;
            }
            
            console.log('=== Guardando inventario ===');
            console.log('Datos a enviar:', data);
            
            // Mostrar loader en el botón
            var $btnGuardar = this.$el.find('[data-action="guardar"]');
            var textoOriginal = $btnGuardar.html();
            $btnGuardar.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');
            
            var self = this;
            
            Espo.Ajax.postRequest('InvPropiedades/action/save', data)
                .then(function (response) {
                    console.log('✅ Respuesta de save:', response);
                    
                    if (response.success) {
                        Espo.Ui.success('Inventario guardado exitosamente');
                        
                        // Volver a la lista después de 1 segundo
                        setTimeout(function () {
                            self.getRouter().navigate('#InvLista', { trigger: true });
                        }, 1000);
                    } else {
                        console.error('❌ Error al guardar:', response);
                        Espo.Ui.error(response.error || 'Error al guardar');
                        $btnGuardar.prop('disabled', false).html(textoOriginal);
                    }
                })
                .catch(function (error) {
                    console.error('❌ Error en Ajax save:', error);
                    Espo.Ui.error('Error al guardar inventario');
                    $btnGuardar.prop('disabled', false).html(textoOriginal);
                });
        },

        obtenerRecaudosSeleccionados: function (campoId) {
            var recaudos = [];
            
            this.$el.find('#contenedor-recaudos-' + campoId + ' .recaudo-row').each(function() {
                var recaudoId = $(this).data('recaudo-id');
                var estado = $('#recaudo_' + recaudoId + '_' + campoId).val();
                
                recaudos.push({
                    recaudoId: recaudoId,
                    estado: estado || 'Modificar'
                });
            });
            
            return recaudos;
        },

        calcularNotaLegal: function () {
            var totalRecaudos = Object.keys(this.valoresRecaudosLegal).length;
            if (totalRecaudos === 0) return 'Modificar';
            
            var completosRecaudos = 0;
            Object.values(this.valoresRecaudosLegal).forEach(function (valor) {
                if (valor === 'Adecuado') {
                    completosRecaudos++;
                }
            });
            
            var porcentaje = Math.round((completosRecaudos / totalRecaudos) * 100);
            
            if (porcentaje === 100) return 'Adecuado';
            if (porcentaje >= 50) return 'Revisar';
            return 'Modificar';
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