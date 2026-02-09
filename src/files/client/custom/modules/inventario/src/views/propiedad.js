define('inventario:views/propiedad', [
    'view',
    'inventario:views/modules/semaforo',
    'inventario:views/modules/subbuyer',
    'inventario:views/modules/calculadora-notas',
    'inventario:views/modules/recaudos-dinamicos'
], function (Dep, SemaforoManager, SubBuyerManager, CalculadoraNotas, RecaudosDinamicosManager) {
    
    return Dep.extend({
        
        template: 'inventario:propiedad',

        setup: function () {
            Dep.prototype.setup.call(this);
            
            console.log('=== propiedad.js - setup() ===');
            console.log('this.options:', this.options);
            
            this.propiedadId = this.options.propiedadId;
            
            console.log('propiedadId asignado:', this.propiedadId);
            console.log('Tipo:', typeof this.propiedadId);
            
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
            
            // Inicializar módulos
            this.semaforoManager = new SemaforoManager(this);
            this.subBuyerManager = new SubBuyerManager(this);
            this.calculadoraNotas = new CalculadoraNotas(this);
            this.recaudosDinamicosManager = new RecaudosDinamicosManager(this);
            
            // Variables para almacenar valores de recaudos
            this.valoresRecaudosLegal = {};
            this.valoresRecaudosMercadeo = {};
            this.valoresRecaudosApoderado = {};
            
            // Cargar datos
            this.cargarDatos();
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.setupEventListeners();
            
            // Inicializar porcentajes
            if (this.calculadoraNotas) {
                this.calculadoraNotas.inicializarPorcentajes();
            }
            
            // Inicializar estados del panel "Otros"
            this.actualizarEstadosOtros();
        },

        setupEventListeners: function () {
            var self = this;
            
            // Toggle panels
            this.$el.find('[data-action="toggle-panel"]').on('click', function (e) {
                self.togglePanel(e.currentTarget);
            });

            // Volver
            this.$el.find('[data-action="volver"]').on('click', function () {
                self.getRouter().navigate('#InvLista', { trigger: true });
            });

            // Cancelar
            this.$el.find('[data-action="cancelar"]').on('click', function () {
                self.getRouter().navigate('#InvLista', { trigger: true });
            });

            // Guardar
            this.$el.find('[data-action="guardar"]').on('click', function () {
                self.guardarInventario();
            });

            // Apoderado radio change
            this.$el.find('input[name="apoderado"]').on('change', function (e) {
                var valor = $(e.currentTarget).val();
                self.mostrarObligaciones(valor === 'true');
                
                // Si se selecciona "Sí", calcular porcentaje de apoderado
                if (valor === 'true' && self.calculadoraNotas) {
                    self.calcularPorcentajeApoderado();
                } else {
                    self.$el.find('#nota-apoderado').text('0%');
                }
            });

            // Cambio en tipo de persona (Natural/Jurídico)
            this.$el.find('#tipoPersona').on('change', function (e) {
                var tipo = $(e.target).val();
                self.toggleContenidoLegal(tipo);
                
                // Cargar recaudos legales según tipo de persona
                if (self.recaudosDinamicosManager) {
                    self.cargarRecaudosLegal(tipo);
                }
                
                // Calcular notas
                if (self.calculadoraNotas) {
                    self.calculadoraNotas.calcularNotas();
                }
            });

            // Cambio en selects de semáforo tradicionales (para panel "Otros")
            this.$el.find('.select-semaforo, .select-semaforo-precio').on('change', function () {
                if (self.calculadoraNotas) {
                    self.calculadoraNotas.calcularNotas();
                }
                self.actualizarColorSelect($(this));
            });

            // Setup de módulos
            if (this.semaforoManager) {
                this.semaforoManager.setupEventListeners();
            }
            
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
                self.eliminarRecaudo(e);
            });
            
            // Event listener para agregar recaudos
            this.$el.on('click', '.btn-agregar-recaudo', function (e) {
                e.preventDefault();
                self.agregarRecaudoSeleccionado(e);
            });
            
            // Cambio en buyer persona para cargar sub buyers
            this.$el.find('#buyerPersona').on('change', function (e) {
                var buyerSeleccionado = $(e.target).val();
                if (self.subBuyerManager) {
                    self.subBuyerManager.cargarSubBuyers(buyerSeleccionado);
                }
            });
            
            // Event listener para selección de semáforo en panel "Otros"
            this.$el.on('click', '[data-action="selectSemaforo"]', function (e) {
                self.seleccionarSemaforoOtros(e);
            });
            
            // Aplicar colores a selects de semáforo (si existen)
            this.aplicarColoresSemaforo();
            
            // Inicializar sub buyer manager
            if (this.subBuyerManager) {
                this.subBuyerManager.inicializar();
            }
        },

        togglePanel: function (element) {
            var $heading = $(element);
            var $panel = $heading.parent();
            var $body = $panel.find('.panel-body');
            var $icon = $heading.find('.fa-chevron-down, .fa-chevron-up');
            
            if ($body.is(':visible')) {
                $body.slideUp(200);
                $icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            } else {
                $body.slideDown(200);
                $icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            }
        },

        toggleContenidoLegal: function (tipoPersona) {
            // Eliminar el contenido de estado legal que ya no se necesita
            this.$el.find('#contenido-natural').remove();
            this.$el.find('#contenido-juridico').remove();
            
            // Solo mostrar mensaje informativo
            var $legalPanel = this.$el.find('#contenedor-recaudos-legal').closest('.panel-body');
            if ($legalPanel.find('.info-legal').length === 0) {
                $legalPanel.prepend(
                    '<div class="alert alert-info info-legal" style="margin-bottom: 20px;">' +
                    '<i class="fas fa-info-circle"></i> ' +
                    'Seleccione el tipo de persona para cargar los requisitos legales correspondientes.' +
                    '</div>'
                );
            }
        },

        mostrarObligaciones: function (mostrar) {
            var $contenedorRecaudos = this.$el.find('#contenedor-recaudos-apoderado');
            var $panelAgregar = this.$el.find('#panel-agregar-apoderado');
            
            if (mostrar) {
                $contenedorRecaudos.slideDown(200);
                // Cargar recaudos de apoderado si no se han cargado
                if (this.recaudosDinamicosManager && $contenedorRecaudos.find('.spinner-small').length > 0) {
                    this.cargarRecaudosApoderado();
                }
                
                // Mostrar panel para agregar si corresponde
                if ($panelAgregar.length > 0) {
                    $panelAgregar.slideDown(200);
                }
            } else {
                $contenedorRecaudos.slideUp(200);
                if ($panelAgregar.length > 0) {
                    $panelAgregar.slideUp(200);
                }
            }
        },

        aplicarColoresSemaforo: function () {
            var self = this;
            
            // Selects de semáforo estándar (si aún existen)
            this.$el.find('.select-semaforo').each(function () {
                var $select = $(this);
                self.actualizarColorSelect($select);
            });

            // Select de precio (si existe)
            this.$el.find('.select-semaforo-precio').each(function () {
                var $select = $(this);
                self.actualizarColorSelectPrecio($select);
            });
        },

        actualizarColorSelect: function ($select) {
            var valor = $select.val();
            
            $select.css({
                'background-color': '',
                'color': '',
                'font-weight': 'bold'
            });
            
            if (valor === 'Modificar' || valor === 'No exclusividad') {
                $select.css({
                    'background-color': '#e74c3c',
                    'color': 'white'
                });
            } else if (valor === 'Revisar') {
                $select.css({
                    'background-color': '#f39c12',
                    'color': 'white'
                });
            } else if (valor === 'Adecuado' ||
                       valor === 'Exclusividad interna de CENTURY con contrato firmado' ||
                       valor === 'Exclusividad pura o total con contrato firmado') {
                $select.css({
                    'background-color': '#27ae60',
                    'color': 'white'
                });
            }
        },

        actualizarColorSelectPrecio: function ($select) {
            var valor = $select.val();
            
            $select.css({
                'background-color': '',
                'color': '',
                'font-weight': 'bold'
            });
            
            if (valor === 'Debajo del rango') {
                $select.css({
                    'background-color': '#e74c3c',
                    'color': 'white'
                });
            } else if (valor === 'En rango') {
                $select.css({
                    'background-color': '#27ae60',
                    'color': 'white'
                });
            } else if (valor === 'Sobre el rango') {
                $select.css({
                    'background-color': '#f39c12',
                    'color': 'white'
                });
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
                        
                        self.mostrarDatos();
                    } else {
                        console.error('❌ Response con success=false:', response);
                        Espo.Ui.error(response.error || 'Error al cargar datos');
                        self.getRouter().navigate('#InvLista', { trigger: true });
                    }
                })
                .catch(function (error) {
                    console.error('❌ Error en Ajax:', error);
                    Espo.Ui.error('Error al cargar datos de la propiedad');
                    self.getRouter().navigate('#InvLista', { trigger: true });
                });
        },

        mostrarDatos: function () {
            console.log('=== mostrarDatos() ===');
            
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
            
            // Cargar recaudos legales según tipo de persona
            if (this.recaudosDinamicosManager) {
                this.cargarRecaudosLegal(tipoPersona);
            }
            
            // Panel 3: Mercadeo
            var buyerPersona = this.inventarioData.buyerPersona || this.inventarioData.buyer || 'Comprador';
            this.$el.find('#buyerPersona').val(buyerPersona);
            
            // Cargar recaudos de mercadeo
            if (this.recaudosDinamicosManager) {
                this.cargarRecaudosMercadeo();
            }
            
            // Configurar sub buyer inicial
            var subBuyerInicial = this.inventarioData.subBuyerPersona || this.inventarioData.subBuyer || '';
            if (this.subBuyerManager) {
                this.subBuyerManager.setValorInicial(subBuyerInicial);
            }
            
            // Panel 4: Apoderado
            var apoderado = this.inventarioData.apoderado || false;
            if (apoderado) {
                this.$el.find('input[name="apoderado"][value="true"]').prop('checked', true);
                this.mostrarObligaciones(true);
                // Cargar recaudos de apoderado
                if (this.recaudosDinamicosManager) {
                    this.cargarRecaudosApoderado();
                }
                // Calcular porcentaje inicial
                this.calcularPorcentajeApoderado();
            } else {
                this.$el.find('input[name="apoderado"][value="false"]').prop('checked', true);
                this.mostrarObligaciones(false);
                this.$el.find('#nota-apoderado').text('0%');
            }
            
            // Inicializar semáforos del panel 5 (Otros)
            if (this.semaforoManager) {
                this.semaforoManager.inicializarTodosLosCampos(this.inventarioData);
                this.actualizarEstadosOtros();
            }
            
            // Aplicar colores a los selects tradicionales
            this.aplicarColoresSemaforo();
            
            // Calcular notas iniciales
            if (this.calculadoraNotas) {
                this.calculadoraNotas.calcularNotas();
            }
            
            console.log('✅ Datos mostrados en UI');
        },

        // Métodos para cargar recaudos
        cargarRecaudosLegal: function (tipoPersona) {
            var self = this;
            var tipoRecaudo = tipoPersona === 'Natural' ? 'Natural' : 'Juridico';
            
            // Primero cargar recaudos por defecto
            this.recaudosDinamicosManager.cargarRecaudosPorTipo(tipoRecaudo, true)
                .then(function (recaudosDefault) {
                    var htmlDefault = self.recaudosDinamicosManager.crearHTMLRecaudos(recaudosDefault, 'legal', true);
                    
                    // Luego cargar recaudos NO por defecto para el dropdown
                    return self.recaudosDinamicosManager.cargarRecaudosPorTipo(tipoRecaudo, false)
                        .then(function (recaudosNoDefault) {
                            var html = htmlDefault;
                            
                            // Agregar recaudos que ya estaban agregados (de guardados anteriores)
                            if (self.inventarioData.valoresRecaudosLegal) {
                                // Aquí procesaríamos los recaudos guardados anteriormente
                            }
                            
                            self.$el.find('#contenedor-recaudos-legal').html(html);
                            
                            // Cargar el select para agregar nuevos recaudos
                            self.recaudosDinamicosManager.cargarSelectAgregarRecaudos(tipoRecaudo, 'legal');
                            
                            // Inicializar tooltips
                            self.inicializarTooltipsRecaudos();
                            
                            // Inicializar valores guardados si existen
                            self.inicializarValoresRecaudosGuardados('legal');
                        });
                })
                .catch(function (error) {
                    console.error('Error cargando recaudos legales:', error);
                    self.$el.find('#contenedor-recaudos-legal').html(
                        '<div class="alert alert-danger">Error al cargar requisitos legales</div>'
                    );
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
            
            // Actualizar el estado general del panel "Otros"
            this.actualizarEstadoPanelOtros();
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

        actualizarEstadoPanelOtros: function () {
            var campos = ['exclusividad', 'precio', 'ubicacion', 'demanda'];
            var estados = [];
            
            campos.forEach(function (campo) {
                var valor = this.$el.find('#' + campo).val();
                var estado = this.obtenerEstadoDeValor(valor);
                estados.push(estado);
            }.bind(this));
            
            // Determinar el peor estado (jerarquía: Modificar > Revisar > Adecuado > Pendiente)
            var estadoFinal = 'Pendiente';
            if (estados.includes('Modificar')) {
                estadoFinal = 'Modificar';
            } else if (estados.includes('Revisar')) {
                estadoFinal = 'Revisar';
            } else if (estados.includes('Adecuado')) {
                estadoFinal = 'Adecuado';
            }
            
            // Actualizar el badge del panel
            var $panelBadge = this.$el.find('#status-otros');
            var color = this.obtenerColorEstado(estadoFinal);
            
            $panelBadge.css('background-color', color);
            $panelBadge.find('.status-text').text(estadoFinal);
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

        actualizarEstadosOtros: function () {
            var self = this;
            var campos = ['exclusividad', 'precio', 'ubicacion', 'demanda'];
            
            campos.forEach(function (campo) {
                var valor = self.$el.find('#' + campo).val();
                if (valor) {
                    self.actualizarEstadoCampo(campo, valor);
                }
            });
            
            this.actualizarEstadoPanelOtros();
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
            $filas.each(function () {
                var recaudoId = $(this).data('recaudo-id');
                var valor = this.$el.find('#recaudo_' + recaudoId + '_apoderado').val();
                if (valor === 'Adecuado') {
                    completosRecaudos++;
                }
            }.bind(this));
            
            var porcentaje = Math.round((completosRecaudos / totalRecaudos) * 100);
            this.$el.find('#nota-apoderado').text(porcentaje + '%');
        },

        eliminarRecaudo: function (e) {
            var $target = $(e.currentTarget);
            var recaudoId = $target.data('recaudo-id');
            var campoId = $target.data('campo-id');
            
            // Confirmar eliminación
            if (!confirm('¿Está seguro de que desea eliminar este elemento?')) {
                return;
            }
            
            // Eliminar del manager
            this.recaudosDinamicosManager.eliminarRecaudo(recaudoId, campoId);
            
            // Eliminar de los valores guardados
            if (campoId === 'legal') {
                delete this.valoresRecaudosLegal[recaudoId];
                // Recalcular nota legal
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
            } else if (campoId === 'mercadeo') {
                delete this.valoresRecaudosMercadeo[recaudoId];
                // Recalcular nota de mercadeo
                if (this.calculadoraNotas) {
                    this.calculadoraNotas.calcularNotas();
                }
            } else if (campoId === 'apoderado') {
                delete this.valoresRecaudosApoderado[recaudoId];
                // Recalcular porcentaje de apoderado
                this.calcularPorcentajeApoderado();
            }
            
            Espo.Ui.success('Elemento eliminado correctamente');
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
                recaudosAgregadosApoderado: this.recaudosDinamicosManager.recaudosAgregados.apoderado
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

        data: function () {
            return {};
        }
    });
});