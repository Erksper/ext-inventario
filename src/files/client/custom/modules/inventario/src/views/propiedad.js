define('inventario:views/propiedad', [
    'view',
    'inventario:views/modules/permisos',
    'inventario:views/modules/semaforo',
    'inventario:views/modules/calculadora-notas',
    'inventario:views/modules/modal-crear-recaudo'
], function (Dep, PermisosManager, SemaforoManager, CalculadoraNotas, ModalCrearRecaudoManager) {

    return Dep.extend({

        template: 'inventario:propiedad',

        events: {
            'click [data-action="toggle-panel"]': function (e) {
                e.preventDefault();
                e.stopPropagation();
                this.togglePanel(e);
            },
            'click [data-action="volver"], [data-action="cancelar"]': function () {
                // Volver a lista con los filtros guardados
                var queryParams = [];
                
                if (this.filtrosRetorno.cla) queryParams.push('cla=' + encodeURIComponent(this.filtrosRetorno.cla));
                if (this.filtrosRetorno.oficina) queryParams.push('oficina=' + encodeURIComponent(this.filtrosRetorno.oficina));
                if (this.filtrosRetorno.asesor) queryParams.push('asesor=' + encodeURIComponent(this.filtrosRetorno.asesor));
                if (this.filtrosRetorno.fechaDesde) queryParams.push('fechaDesde=' + encodeURIComponent(this.filtrosRetorno.fechaDesde));
                if (this.filtrosRetorno.fechaHasta) queryParams.push('fechaHasta=' + encodeURIComponent(this.filtrosRetorno.fechaHasta));
                if (this.filtrosRetorno.estatus) queryParams.push('estatus=' + encodeURIComponent(this.filtrosRetorno.estatus));
                if (this.filtrosRetorno.pagina) queryParams.push('pagina=' + this.filtrosRetorno.pagina);
                
                var queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
                var ruta = '#InvLista' + queryString;
                
                this.getRouter().navigate(ruta, { trigger: true });
            },
            'click [data-action="guardar"]': function () {
                this.guardarInventario();
            },
            'change #buyerPersona': function (e) {
                if (!this.puedeEditar) return;
                this.subBuyersSeleccionados = [];
                this.cargarSubBuyersDisponibles($(e.currentTarget).val());
            },
            'change input[name="apoderado"]': function (e) {
                if (!this.puedeEditar) return;
                var mostrar = $(e.currentTarget).val() === 'true';
                this.mostrarObligaciones(mostrar);
                if (mostrar && this.listasRecaudos.apoderado.mostrados.length === 0) {
                    this.cargarYMostrarRecaudosApoderado();
                }
            },
            'change #tipoPersona': function (e) {
                if (!this.puedeEditar) return;
                this.cargarYMostrarRecaudosLegales($(e.target).val());
                this.calcularNotasPorcentajes();
            },
            'change .select-otros': function (e) {
                if (!this.puedeEditar) return;
                this.manejarCambioSelectOtros(e);
            },
            'click [data-action="selectRecaudoSemaforo"]': function (e) {
                if (!this.puedeEditar) return;
                this.seleccionarRecaudoSemaforo(e);
            },
            'click [data-action="showInfoRecaudo"]': function (e) {
                e.preventDefault();
                e.stopPropagation();
                this.mostrarInfoRecaudoModal(e);
            },
            'click [data-action="eliminarRecaudo"]': function (e) {
                if (!this.puedeEditar) return;
                e.preventDefault();
                e.stopPropagation();
                this.manejarEliminacionRecaudo(e);
            },
            'click .btn-agregar-recaudo': function (e) {
                if (!this.puedeEditar) return;
                e.preventDefault();
                this.manejarAgregarRecaudo(e);
            }
        },

        setup: function () {
            Dep.prototype.setup.call(this);

            this.propiedadId = this.options.propiedadId;
            
            // Guardar filtros de la URL para volver
            this.filtrosRetorno = this.parseFiltrosRetorno();
            
            this.permisosManager = new PermisosManager(this);
            this.puedeEditar = false;
            this.esAsesor = false;
            this.usuarioId = this.getUser().id;
            this.datosListos = false;

            if (!this.propiedadId) {
                console.error('❌ NO HAY propiedadId');
                Espo.Ui.error('ID de propiedad no proporcionado');
                this.getRouter().navigate('#InvLista', { trigger: true });
                return;
            }

            this.datosYaCargados    = false;
            this.cargandoDatos      = false;
            this.vistaYaRenderizada = false;

            this.inventarioId   = null;
            this.inventarioData = null;
            this.propiedadData  = null;

            this.subBuyersSeleccionados = [];
            this.initializeListasRecaudos();

            this.semaforoManager    = new SemaforoManager(this);
            this.calculadoraNotas   = new CalculadoraNotas(this);
            this.modalCrearRecaudo  = new ModalCrearRecaudoManager(this);

            this.valoresRecaudosLegal     = {};
            this.valoresRecaudosMercadeo  = {};
            this.valoresRecaudosApoderado = {};

            this.datosCompletamenteCargados = false;
            this.cargasPendientes           = 0;

            // Primero cargar permisos, luego los datos
            this.cargarPermisosYValidarAcceso();
        },

        // Parsear filtros de retorno desde la URL
        parseFiltrosRetorno: function() {
            var hash = window.location.hash;
            var filtros = {};
            
            if (hash && hash.includes('?')) {
                var queryString = hash.split('?')[1];
                var params = new URLSearchParams(queryString);
                
                if (params.get('cla')) filtros.cla = params.get('cla');
                if (params.get('oficina')) filtros.oficina = params.get('oficina');
                if (params.get('asesor')) filtros.asesor = params.get('asesor');
                if (params.get('fechaDesde')) filtros.fechaDesde = params.get('fechaDesde');
                if (params.get('fechaHasta')) filtros.fechaHasta = params.get('fechaHasta');
                if (params.get('estatus')) filtros.estatus = params.get('estatus');
                if (params.get('pagina')) filtros.pagina = params.get('pagina');
            }
            
            return filtros;
        },

        cargarPermisosYValidarAcceso: function () {
            this.permisosManager.cargarPermisosUsuario()
                .then(function (permisos) {
                    this.permisos = permisos;
                    this.esAsesor = permisos.esAsesor;
                    
                    console.log('🔍 PERMISOS USUARIO:', this.permisos);
                    
                    // Ahora cargar datos de la propiedad
                    this.cargarDatos();
                }.bind(this))
                .catch(function (error) {
                    console.error('Error cargando permisos:', error);
                    Espo.Ui.error('Error al verificar permisos');
                    this.getRouter().navigate('#InvLista', { trigger: true });
                }.bind(this));
        },

        validarAccesoPropiedad: function (propiedadData, inventarioData) {
            var self = this;
            return new Promise(function (resolve, reject) {
                console.log('🔍 Validando acceso para propiedad:', propiedadData.id);
                console.log('🔍 Permisos usuario:', self.permisos);
                
                // Casa Nacional puede ver todo
                if (self.permisos.esCasaNacional) {
                    self.puedeEditar = true;
                    console.log('✅ Casa Nacional - Acceso total y edición permitida');
                    resolve();
                    return;
                }

                // Obtener oficina de la propiedad (de los teams)
                Espo.Ajax.getRequest('InvLista/action/getPropiedadTeams', { propiedadId: self.propiedadId })
                    .then(function (response) {
                        console.log('🔍 Respuesta getPropiedadTeams:', response);
                        
                        if (!response.success) {
                            reject('Error al obtener datos de la propiedad');
                            return;
                        }

                        var oficinaPropiedadId = response.data.oficinaId;
                        var asesorPropiedadId = response.data.asesorId;

                        // Si es Gerente/Director, validar por oficina
                        if (self.permisos.esGerente || self.permisos.esDirector || self.permisos.esCoordinador) {
                            console.log('🔍 Usuario es Gerente/Director');
                            console.log('🔍 Oficina usuario:', self.permisos.oficinaUsuario);
                            console.log('🔍 Oficina propiedad:', oficinaPropiedadId);
                            
                            if (oficinaPropiedadId === self.permisos.oficinaUsuario) {
                                self.puedeEditar = true;
                                console.log('✅ Gerente - Acceso y edición permitida');
                                resolve();
                            } else {
                                console.log('❌ Gerente - Oficina no coincide');
                                reject('Esta propiedad no pertenece a su oficina');
                            }
                            return;
                        }

                        // Si es Asesor, validar por asesor
                        if (self.permisos.esAsesor) {
                            console.log('🔍 Usuario es Asesor');
                            console.log('🔍 Asesor usuario:', self.usuarioId);
                            console.log('🔍 Asesor propiedad:', asesorPropiedadId);
                            
                            if (asesorPropiedadId === self.usuarioId) {
                                self.puedeEditar = false; // Asesor solo lectura
                                console.log('✅ Asesor - Acceso permitido (solo lectura)');
                                resolve();
                            } else {
                                console.log('❌ Asesor - No coincide asesor');
                                reject('No tiene permisos para ver esta propiedad');
                            }
                            return;
                        }

                        // Otros casos (default) - solo lectura
                        self.puedeEditar = false;
                        console.log('ℹ️ Otro rol - Acceso solo lectura');
                        resolve();
                    })
                    .catch(function (error) {
                        console.error('Error en validación:', error);
                        reject('Error al validar acceso: ' + error);
                    });
            });
        },

        registrarCargaPendiente: function () {
            this.cargasPendientes++;
        },

        marcarCargaCompletada: function () {
            this.cargasPendientes--;
            if (this.cargasPendientes <= 0) {
                this.cargasPendientes           = 0;
                this.datosCompletamenteCargados = true;
                
                if (this.puedeEditar) {
                    this.calcularNotasPorcentajes();
                }
            }
        },

        initializeListasRecaudos: function () {
            this.listasRecaudos = {
                legal: {
                    natural:    { mostrados: [], disponibles: [], esPorDefecto: false },
                    juridico:   { mostrados: [], disponibles: [], esPorDefecto: false },
                    tipoActual: 'natural'
                },
                mercadeo:  { mostrados: [], disponibles: [], esPorDefecto: false },
                apoderado: { mostrados: [], disponibles: [], esPorDefecto: false }
            };
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            if (this.vistaYaRenderizada) return;
            this.vistaYaRenderizada = true;

            console.log('🔍 afterRender - esperando datos...');
            
            // Solo mostrar loader y esperar
            this.$el.find('#loading-container').show();
            this.$el.find('#form-container').hide();
        },

        inicializarInterfazCompleta: function () {
            console.log('🔍 inicializarInterfazCompleta - puedeEditar:', this.puedeEditar);
            console.log('🔍 inicializarInterfazCompleta - permisos:', this.permisos);

            if (this.puedeEditar) {
                console.log('🔍 Inicializando calculadora y modal (modo edición)');
                if (this.calculadoraNotas) this.calculadoraNotas.inicializarPorcentajes();
                if (this.modalCrearRecaudo) this.modalCrearRecaudo.inicializar();
                
                // Semáforo manager solo necesita setup si puede editar
                if (this.semaforoManager) {
                    this.semaforoManager.setupEventListeners();
                }

                // Evento para recaudo creado
                $(document).off('recaudoCreado.inventario').on('recaudoCreado.inventario', function (e, data) {
                    console.log('🔍 Recaudo creado evento recibido:', data);
                    this.onRecaudoCreado(data);
                }.bind(this));
            }

            this.actualizarEstadosOtros();
            this.aplicarModoSoloLectura();

            // Abrir primer panel por defecto
            var $firstPanel = this.$el.find('.panel-heading').first();
            if ($firstPanel.length) {
                $firstPanel.addClass('active');
                $firstPanel.next('.panel-body').show();
                $firstPanel.find('.fas').removeClass('fa-chevron-down').addClass('fa-chevron-up');
            }
        },

        aplicarModoSoloLectura: function () {
            if (!this.puedeEditar) {
                this.$el.find('input, select, textarea, button[data-action="guardar"], .btn-agregar-recaudo, .btn-eliminar-recaudo, .color-option')
                    .prop('disabled', true)
                    .css('opacity', '0.7')
                    .css('cursor', 'not-allowed');
                
                this.$el.find('[data-action="guardar"]').hide();
                
                if (this.$el.find('#modo-lectura-msg').length === 0) {
                    this.$el.find('#form-container').prepend(
                        '<div id="modo-lectura-msg" class="alert alert-info" style="margin-bottom:20px;">' +
                        '<i class="fas fa-info-circle"></i> ' +
                        'Modo solo lectura: No tiene permisos para editar esta propiedad.' +
                        '</div>'
                    );
                }
            } else {
                this.$el.find('input, select, textarea, button[data-action="guardar"], .btn-agregar-recaudo, .btn-eliminar-recaudo, .color-option')
                    .prop('disabled', false)
                    .css('opacity', '1')
                    .css('cursor', 'pointer');
                
                this.$el.find('[data-action="guardar"]').show();
                this.$el.find('#modo-lectura-msg').remove();
            }
        },

        togglePanel: function (e) {
            var $header = $(e.currentTarget);
            var $panel = $header.closest('.panel');
            var $body = $panel.find('.panel-body');
            var $icon = $header.find('.fa-chevron-down, .fa-chevron-up');

            if ($body.is(':visible')) {
                $body.slideUp('fast');
                $icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
                $header.removeClass('active');
            } else {
                $body.slideDown('fast');
                $icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
                $header.addClass('active');
            }
        },

        mostrarObligaciones: function (mostrar) {
            var $cont  = this.$el.find('#contenedor-recaudos-apoderado');
            var $panel = this.$el.find('#panel-agregar-apoderado');
            if (mostrar) { $cont.slideDown(200); $panel.slideDown(200); }
            else         { $cont.slideUp(200);   $panel.slideUp(200);   }
        },

        cargarDatos: function () {
            if (this.datosYaCargados || this.cargandoDatos) return;
            this.cargandoDatos = true;

            var self = this;
            Espo.Ajax.getRequest('InvPropiedades/action/getOrCreate', { propiedadId: this.propiedadId })
                .then(function (response) {
                    if (response.success) {
                        self.inventarioData = response.data.inventario;
                        self.propiedadData  = response.data.propiedad;
                        self.inventarioId   = self.inventarioData.id;
                        
                        return self.validarAccesoPropiedad(self.propiedadData, self.inventarioData);
                    } else {
                        throw new Error(response.error || 'Error al cargar datos');
                    }
                })
                .then(function () {
                    self.datosYaCargados = true;
                    self.cargandoDatos   = false;
                    self.mostrarDatos();
                    
                    self.inicializarInterfazCompleta();
                })
                .catch(function (error) {
                    console.error('Error:', error);
                    self.$el.find('#loading-container').hide();
                    self.cargandoDatos = false;
                    
                    var mensaje = typeof error === 'string' ? error : 'Error al cargar datos de la propiedad';
                    Espo.Ui.error(mensaje);
                    
                    setTimeout(function () {
                        self.getRouter().navigate('#InvLista', { trigger: true });
                    }, 2000);
                });
        },

        mostrarDatos: function () {
            this.$el.find('#loading-container').hide();
            this.$el.find('#form-container').show();

            this.mostrarInfoPropiedad();

            var tipoPersona = this.inventarioData.tipoPersona || 'Natural';
            this.$el.find('#tipoPersona').val(tipoPersona);

            this.registrarCargaPendiente();
            this.cargarYMostrarRecaudosLegales(tipoPersona);

            this.registrarCargaPendiente();
            this.mostrarInfoMercadeo();

            this.mostrarInfoOtros();
            this.mostrarInfoApoderado();

            this.$el.find('.panel-body').hide();
            this.$el.find('.panel-heading .fas')
                .removeClass('fa-chevron-up').addClass('fa-chevron-down');
        },

        mostrarInfoPropiedad: function () {
            this.$el.find('#prop-tipoOperacion').text(this.propiedadData.tipoOperacion  || '-');
            this.$el.find('#prop-tipoPropiedad').text(this.propiedadData.tipoPropiedad  || '-');
            this.$el.find('#prop-subTipoPropiedad').text(this.propiedadData.subTipoPropiedad || '-');
            
            // Mostrar precio
            var precioTexto = '-';
            if (this.propiedadData.precioEnContrato) {
                var moneda = this.propiedadData.monedaEnContrato || 'USD';
                try {
                    var formatter = new Intl.NumberFormat('es-VE', {
                        style: 'currency',
                        currency: moneda,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    });
                    precioTexto = formatter.format(this.propiedadData.precioEnContrato);
                } catch (e) {
                    precioTexto = this.propiedadData.precioEnContrato + ' ' + moneda;
                }
            }
            this.$el.find('#prop-precio').text(precioTexto);
            
            this.$el.find('#prop-m2C').text(this.propiedadData.m2C ? this.propiedadData.m2C + ' m²' : '-');
            this.$el.find('#prop-m2T').text(this.propiedadData.m2T ? this.propiedadData.m2T + ' m²' : '-');
            this.$el.find('#prop-ubicacion').text(this.propiedadData.ubicacion || '-');
            this.$el.find('#prop-asesor').text(this.propiedadData.asesorNombre || '-');

            if (this.propiedadData.fechaAlta) {
                this.$el.find('#prop-fechaAlta').text(
                    new Date(this.propiedadData.fechaAlta).toLocaleDateString('es-ES')
                );
            } else {
                this.$el.find('#prop-fechaAlta').text('-');
            }

            this.$el.find('#prop-diasMercado').text(this.calcularDiasEnMercado(this.propiedadData.fechaAlta));

            // Estado como texto plano (sin badge)
            var statusOriginal = this.propiedadData.status || '-';
            var statusFormateado = statusOriginal;
            
            // Formatear 'enPromocion' a 'En promocion'
            if (statusOriginal && (statusOriginal.toLowerCase() === 'enpromocion' || statusOriginal === 'enPromocion')) {
                statusFormateado = 'En promocion';
            }
            
            this.$el.find('#prop-status').text(statusFormateado);
        },

        calcularDiasEnMercado: function (fechaAlta) {
            if (!fechaAlta) return '-';
            return Math.floor((new Date() - new Date(fechaAlta)) / (1000 * 60 * 60 * 24)) + ' días';
        },

        mostrarInfoMercadeo: function () {
            var self = this;
            var buyerPersona = this.inventarioData.buyerPersona || this.inventarioData.buyer || 'Comprador';
            this.$el.find('#buyerPersona').val(buyerPersona);

            this.cargarYMostrarRecaudosMercadeo()
                .then(function ()  { self.marcarCargaCompletada(); })
                .catch(function () { self.marcarCargaCompletada(); });

            this.cargarSubBuyersDisponibles(buyerPersona);
            this.cargarSubBuyersSeleccionados();
        },

        mostrarInfoApoderado: function () {
            var self      = this;
            var apoderado = this.inventarioData.apoderado || false;

            if (apoderado) {
                this.$el.find('input[name="apoderado"][value="true"]').prop('checked', true);
                this.mostrarObligaciones(true);
                this.registrarCargaPendiente();
                this.cargarYMostrarRecaudosApoderado()
                    .then(function ()  { self.marcarCargaCompletada(); })
                    .catch(function () { self.marcarCargaCompletada(); });
            } else {
                this.$el.find('input[name="apoderado"][value="false"]').prop('checked', true);
                this.mostrarObligaciones(false);
            }
        },

        mostrarInfoOtros: function () {
            var exclusividad = this.inventarioData.exclusividad || 'Sin exclusividad';
            var precio       = this.inventarioData.precio       || 'Fuera del rango de precio';
            var ubicacion    = this.inventarioData.ubicacion    || 'Ubicación no atractiva';
            var demanda      = this.inventarioData.demanda      || 'Baja demanda';

            this.$el.find('#select-exclusividad').val(exclusividad);
            this.$el.find('#select-precio').val(precio);
            this.$el.find('#select-ubicacion').val(ubicacion);
            this.$el.find('#select-demanda').val(demanda);

            this.actualizarEstiloSelect('exclusividad', exclusividad);
            this.actualizarEstiloSelect('precio',       precio);
            this.actualizarEstiloSelect('ubicacion',    ubicacion);
            this.actualizarEstiloSelect('demanda',      demanda);
        },

        // ========== SUB BUYERS ==========

        cargarSubBuyersDisponibles: function (buyerTipo) {
            var self = this;
            var $container = this.$el.find('#subbuyers-checkbox-container');
            
            $container.html('<div class="text-center" style="padding:20px;color:#999;"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>');

            Espo.Ajax.getRequest('InvPropiedades/action/getSubBuyersByBuyer', { buyer: buyerTipo })
                .then(function (response) {
                    if (response.success && response.data && response.data.length > 0) {
                        var html = '';
                        response.data.forEach(function (sb) {
                            var checked = self.subBuyersSeleccionados.includes(sb.id) ? 'checked' : '';
                            var disabled = !self.puedeEditar ? 'disabled' : '';
                            html += '<label class="subbuyer-checkbox-option">';
                            html += '<input type="checkbox" class="subbuyer-checkbox" value="' + sb.id + '" data-name="' + self.escapeHtml(sb.name) + '" ' + checked + ' ' + disabled + '>';
                            html += '<span class="checkbox-custom"></span>';
                            html += '<span class="checkbox-label">' + self.escapeHtml(sb.name) + '</span>';
                            html += '</label>';
                        });
                        $container.html(html);
                        
                        if (self.puedeEditar) {
                            $container.find('.subbuyer-checkbox').on('change', function () {
                                self.actualizarSubBuyersSeleccionados();
                            });
                        }
                    } else {
                        $container.html('<div class="subbuyers-no-options"><i class="fas fa-info-circle"></i> No hay sub buyers disponibles</div>');
                    }
                })
                .catch(function () {
                    $container.html('<div class="subbuyers-no-options" style="color:#e74c3c;"><i class="fas fa-exclamation-circle"></i> Error al cargar</div>');
                });
        },

        actualizarSubBuyersSeleccionados: function () {
            if (!this.puedeEditar) return;
            
            var seleccionados = [];
            
            this.$el.find('.subbuyer-checkbox:checked').each(function () {
                var valor = $(this).val();
                if (valor !== undefined && valor !== null) {
                    seleccionados.push(valor);
                }
            });
            
            this.subBuyersSeleccionados = seleccionados;
        },

        cargarSubBuyersSeleccionados: function () {
            var self = this;
            if (!this.inventarioId) return;

            Espo.Ajax.getRequest('InvPropiedades/action/getSubBuyersPropiedad', { inventarioId: this.inventarioId })
                .then(function (response) {
                    if (response.success && response.data) {
                        self.subBuyersSeleccionados = response.data.map(function (sb) { return sb.id; });
                        
                        setTimeout(function() {
                            self.subBuyersSeleccionados.forEach(function (sbId) {
                                self.$el.find('.subbuyer-checkbox[value="' + sbId + '"]').prop('checked', true);
                            });
                        }, 100);
                    }
                });
        },

        obtenerSubBuyersSeleccionados: function () {
            var seleccionados = [];
            this.$el.find('.subbuyer-checkbox:checked').each(function () {
                seleccionados.push($(this).val());
            });
            return seleccionados;
        },

        // ========== RECAUDOS ==========

        cargarYMostrarRecaudosLegales: function (tipoPersona) {
            var self      = this;
            var $cont     = this.$el.find('#contenedor-recaudos-legal');
            $cont.html('<div class="text-center" style="padding:20px;"><div class="spinner-small"></div><p>Cargando...</p></div>');

            return this.cargarRecaudosPorTipo('legal', tipoPersona)
                .then(function (resultado) {
                    var tipo = tipoPersona.toLowerCase();
                    self.listasRecaudos.legal[tipo]        = resultado;
                    self.listasRecaudos.legal.tipoActual   = tipo;
                    self.actualizarVistaRecaudos('legal', tipo, resultado);
                    self.actualizarDropdownRecaudos('legal', resultado.disponibles);
                    self.marcarCargaCompletada();
                    return resultado;
                })
                .catch(function (e) {
                    $cont.html('<div class="alert alert-danger">Error al cargar requisitos legales</div>');
                    self.marcarCargaCompletada();
                });
        },

        cargarYMostrarRecaudosMercadeo: function () {
            var self  = this;
            var $cont = this.$el.find('#contenedor-recaudos-mercadeo');
            $cont.html('<div class="text-center" style="padding:20px;"><div class="spinner-small"></div><p>Cargando...</p></div>');

            return this.cargarRecaudosPorTipo('mercadeo', 'Mercadeo')
                .then(function (resultado) {
                    self.listasRecaudos.mercadeo = resultado;
                    self.actualizarVistaRecaudos('mercadeo', null, resultado);
                    self.actualizarDropdownRecaudos('mercadeo', resultado.disponibles);
                    return resultado;
                })
                .catch(function () {
                    $cont.html('<div class="alert alert-danger">Error al cargar mercadeo</div>');
                });
        },

        cargarYMostrarRecaudosApoderado: function () {
            var self  = this;
            var $cont = this.$el.find('#contenedor-recaudos-apoderado');

            if (this.listasRecaudos.apoderado.mostrados.length > 0) {
                this.actualizarVistaRecaudos('apoderado', null, this.listasRecaudos.apoderado);
                return Promise.resolve(this.listasRecaudos.apoderado);
            }

            $cont.html('<div class="text-center" style="padding:20px;"><div class="spinner-small"></div><p>Cargando...</p></div>');

            return this.cargarRecaudosPorTipo('apoderado', 'Apoderado')
                .then(function (resultado) {
                    self.listasRecaudos.apoderado = resultado;
                    self.actualizarVistaRecaudos('apoderado', null, resultado);
                    self.actualizarDropdownRecaudos('apoderado', resultado.disponibles);
                    return resultado;
                })
                .catch(function () {
                    $cont.html('<div class="alert alert-danger">Error al cargar apoderado</div>');
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
                    if (!response.success) { reject(new Error(response.error)); return; }
                    var recaudosGuardados = response.data.recaudos || [];
                    var esPorDefecto      = response.data.esPorDefecto || false;

                    recaudosGuardados.forEach(function (r) {
                        var id = String(r.id);
                        if (tipo === 'legal')     self.valoresRecaudosLegal[id]     = r.estado || 'Modificar/No Tiene';
                        if (tipo === 'mercadeo')  self.valoresRecaudosMercadeo[id]  = r.estado || 'Modificar/No Tiene';
                        if (tipo === 'apoderado') self.valoresRecaudosApoderado[id] = r.estado || 'Modificar/No Tiene';
                    });

                    Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosByTipo', { tipo: tipoBackend })
                        .then(function (response2) {
                            if (!response2.success) { reject(new Error(response2.error)); return; }
                            var todos    = response2.data || [];
                            var mostIds  = recaudosGuardados.map(function (r) { return String(r.id); });
                            var disponibles = todos.filter(function (r) { return !mostIds.includes(String(r.id)); });
                            resolve({ mostrados: recaudosGuardados, disponibles: disponibles, esPorDefecto: esPorDefecto });
                        })
                        .catch(reject);
                })
                .catch(reject);
            });
        },

        manejarAgregarRecaudo: function (e) {
            if (!this.puedeEditar) return;
            
            var $btn      = $(e.currentTarget);
            var tipo      = $btn.data('tipo');
            var $select   = this.$el.find('#select-agregar-' + tipo);
            var recaudoId = $select.val();
            if (!recaudoId) { Espo.Ui.warning('Por favor seleccione un elemento'); return; }
            if (recaudoId === 'crear_nuevo') { this.mostrarModalCrearRecaudo(tipo); $select.val(''); }
            else { this.agregarRecaudo(tipo, recaudoId); $select.val(''); }
        },

        agregarRecaudo: function (campoId, recaudoId) {
            if (!this.puedeEditar) return;
            
            recaudoId = String(recaudoId);
            var lista = this.obtenerListaActual(campoId);
            if (this.recaudoEstaEnMostrados(lista, recaudoId)) { Espo.Ui.warning('Ya está en la lista'); return; }
            var idx = lista.disponibles.findIndex(function (r) { return String(r.id) === recaudoId; });
            if (idx === -1) { Espo.Ui.warning('No disponible'); return; }
            lista.mostrados.push(lista.disponibles.splice(idx, 1)[0]);
            lista.esPorDefecto = false;
            var tp = campoId === 'legal' ? this.$el.find('#tipoPersona').val().toLowerCase() : null;
            this.actualizarVistaRecaudos(campoId, tp, lista);
            this.actualizarDropdownRecaudos(campoId, lista.disponibles);
            Espo.Ui.success('Recaudo agregado');
        },

        manejarEliminacionRecaudo: function (e) {
            if (!this.puedeEditar) return;
            
            var $t        = $(e.currentTarget);
            var recaudoId = String($t.data('recaudo-id'));
            var campoId   = $t.data('campo-id');
            if (!confirm('¿Desea eliminar este elemento?')) return;
            this.eliminarRecaudo(campoId, recaudoId);
        },

        eliminarRecaudo: function (campoId, recaudoId) {
            if (!this.puedeEditar) return;
            
            recaudoId = String(recaudoId);
            var lista = this.obtenerListaActual(campoId);
            var idx   = lista.mostrados.findIndex(function (r) { return String(r.id) === recaudoId; });
            if (idx === -1) return;
            var recaudo = lista.mostrados.splice(idx, 1)[0];
            if (!this.recaudoEstaEnDisponibles(lista, recaudoId)) lista.disponibles.push(recaudo);
            this.eliminarValorRecaudo(campoId, recaudoId);
            var tp = campoId === 'legal' ? this.$el.find('#tipoPersona').val().toLowerCase() : null;
            this.actualizarVistaRecaudos(campoId, tp, lista);
            this.actualizarDropdownRecaudos(campoId, lista.disponibles);
            Espo.Ui.success('Recaudo eliminado');
        },

        onRecaudoCreado: function (data) {
            if (!this.puedeEditar) return;
            
            console.log('🔍 onRecaudoCreado - data:', data);
            
            var tipo      = data.tipo;
            var recaudoId = String(data.recaudoId);
            var lista     = this.obtenerListaActual(tipo);
            
            // Verificar si ya existe en mostrados o disponibles
            if (this.recaudoEstaEnMostrados(lista, recaudoId) || this.recaudoEstaEnDisponibles(lista, recaudoId)) {
                console.log('🔍 Recaudo ya existe en la lista');
                return;
            }
            
            // Crear el objeto del nuevo recaudo con estado por defecto "Modificar/No Tiene"
            var nuevoRecaudo = { 
                id: recaudoId, 
                name: data.recaudoNombre, 
                descripcion: '', 
                default: false, 
                tipo: data.recaudoTipo, 
                estado: 'Modificar/No Tiene' // Estado por defecto (rojo)
            };
            
            // Agregar a mostrados
            lista.mostrados.push(nuevoRecaudo);
            lista.esPorDefecto = false;
            
            // Actualizar UI
            var tp = tipo === 'legal' ? this.$el.find('#tipoPersona').val().toLowerCase() : null;
            this.actualizarVistaRecaudos(tipo, tp, lista);
            this.actualizarDropdownRecaudos(tipo, lista.disponibles);
            
            // Actualizar los valores de recaudos con el estado por defecto
            if (tipo === 'legal') {
                this.valoresRecaudosLegal[recaudoId] = 'Modificar/No Tiene';
            } else if (tipo === 'mercadeo') {
                this.valoresRecaudosMercadeo[recaudoId] = 'Modificar/No Tiene';
            } else if (tipo === 'apoderado') {
                this.valoresRecaudosApoderado[recaudoId] = 'Modificar/No Tiene';
            }
            
            // Auto-seleccionar la opción roja
            setTimeout(function() {
                this.$el.find('[data-recaudo-id="' + recaudoId + '"][data-campo-id="' + tipo + '"][data-valor="Modificar/No Tiene"]')
                    .addClass('selected');
            }.bind(this), 100);
            
            Espo.Ui.success('Recaudo creado y agregado');
        },

        obtenerListaActual: function (campoId) {
            if (campoId === 'legal') {
                var $tp = this.$el.find('#tipoPersona');
                var tp  = $tp.length ? $tp.val() : (this.inventarioData.tipoPersona || 'Natural');
                return this.listasRecaudos.legal[(tp || 'Natural').toLowerCase()];
            }
            return this.listasRecaudos[campoId];
        },

        recaudoEstaEnMostrados: function (lista, id) { 
            return lista.mostrados.some(function (r) { return String(r.id) === String(id); }); 
        },

        recaudoEstaEnDisponibles: function (lista, id) { 
            return lista.disponibles.some(function (r) { return String(r.id) === String(id); }); 
        },

        eliminarValorRecaudo: function (campoId, recaudoId) {
            if (campoId === 'legal')     { delete this.valoresRecaudosLegal[recaudoId];     this.calcularNotasPorcentajes(); }
            if (campoId === 'mercadeo')  { delete this.valoresRecaudosMercadeo[recaudoId];  this.calcularNotasPorcentajes(); }
            if (campoId === 'apoderado') { delete this.valoresRecaudosApoderado[recaudoId]; }
        },

        actualizarVistaRecaudos: function (tipo, tipoPersona, lista) {
            var $cont = this.$el.find('#contenedor-recaudos-' + tipo);
            if (lista.mostrados.length === 0) {
                $cont.html('<div class="alert alert-info">No hay recaudos para mostrar</div>');
            } else {
                $cont.html(this.crearHTMLRecaudos(lista.mostrados, tipo, lista.esPorDefecto));
                this.inicializarTooltipsRecaudos();
                this.restaurarSeleccionesRecaudos(tipo);
            }
        },

        restaurarSeleccionesRecaudos: function (campoId) {
            var valores = campoId === 'legal' ? this.valoresRecaudosLegal :
                          campoId === 'mercadeo' ? this.valoresRecaudosMercadeo :
                          this.valoresRecaudosApoderado;
            for (var id in valores) {
                if (!valores.hasOwnProperty(id)) continue;
                this.$el.find('[data-recaudo-id="' + id + '"][data-campo-id="' + campoId + '"][data-valor="' + valores[id] + '"]')
                    .addClass('selected');
            }
        },

        actualizarDropdownRecaudos: function (campoId, disponibles) {
            var $select = this.$el.find('#select-agregar-' + campoId);
            var $panel  = this.$el.find('#panel-agregar-' + campoId);
            if (!$select.length) return;
            
            if (this.puedeEditar) {
                $select.empty().append('<option value="">Seleccione un elemento para agregar</option>');
                if (!disponibles || disponibles.length === 0) {
                    $select.append('<option value="" disabled>No hay elementos disponibles</option>');
                } else {
                    disponibles.forEach(function (r) {
                        $select.append('<option value="' + r.id + '">' + r.name + '</option>');
                    });
                }
                $select.append('<option value="crear_nuevo">+ Crear nuevo requisito</option>');
                $panel.show();
            } else {
                $select.empty().append('<option value="">No disponible en modo lectura</option>');
                $select.prop('disabled', true);
            }
        },

        crearHTMLRecaudos: function (recaudos, campoId, esPorDefecto) {
            var self = this;
            var html = '<div class="recaudos-container"><table class="table table-bordered recaudos-table"><thead><tr><th>Recaudo</th>';
            if (campoId === 'apoderado') {
                html += '<th><i class="fas fa-circle icon-verde"></i> Lo tiene</th>';
                html += '<th><i class="fas fa-circle icon-rojo"></i> No lo tiene</th>';
            } else {
                html += '<th><i class="fas fa-circle icon-verde"></i> Adecuado</th>';
                html += '<th><i class="fas fa-circle icon-amarillo"></i> Revisar</th>';
                html += '<th><i class="fas fa-circle icon-rojo"></i> Modificar/No Tiene</th>';
            }
            html += '<th>Acción</th></tr></thead><tbody>';

            recaudos.forEach(function (recaudo) {
                var id = String(recaudo.id);
                html += '<tr class="recaudo-row" data-recaudo-id="' + id + '">';
                html += '<td><div class="recaudo-texto-container">';
                if (recaudo.descripcion && recaudo.descripcion.trim() !== '') {
                    html += '<span class="recaudo-icon-space"><i class="fas fa-info-circle info-icon" data-action="showInfoRecaudo" data-info="' + self.escapeHtml(recaudo.descripcion) + '" data-recaudo-texto="' + self.escapeHtml(recaudo.name) + '"></i></span>';
                } else {
                    html += '<span class="recaudo-icon-space"></span>';
                }
                html += '<h4>' + self.escapeHtml(recaudo.name) + '</h4></div></td>';

                var opciones = campoId === 'apoderado'
                    ? [{ valor: 'Adecuado', clase: 'color-verde' }, { valor: 'Modificar/No Tiene', clase: 'color-rojo' }]
                    : [{ valor: 'Adecuado', clase: 'color-verde' }, { valor: 'Revisar', clase: 'color-amarillo' }, { valor: 'Modificar/No Tiene', clase: 'color-rojo' }];

                opciones.forEach(function (op) {
                    var disabledAttr = !self.puedeEditar ? ' style="opacity:0.5; cursor:not-allowed;"' : '';
                    var actionAttr = self.puedeEditar ? ' data-action="selectRecaudoSemaforo"' : '';
                    html += '<td><div class="color-option ' + op.clase + '"' + actionAttr + ' data-recaudo-id="' + id + '" data-campo-id="' + campoId + '" data-valor="' + op.valor + '"' + disabledAttr + '></div></td>';
                });

                if (self.puedeEditar) {
                    html += '<td><button class="btn-eliminar-recaudo" data-action="eliminarRecaudo" data-recaudo-id="' + id + '" data-campo-id="' + campoId + '"><i class="fas fa-minus-circle"></i></button></td>';
                } else {
                    html += '<td></td>';
                }
                html += '</tr>';
            });

            html += '</tbody></table></div>';
            return html;
        },

        manejarCambioSelectOtros: function (e) {
            if (!this.puedeEditar) return;
            
            var $s    = $(e.currentTarget);
            var campo = $s.data('campo');
            var valor = $s.val();
            this.actualizarEstiloSelect(campo, valor);
            this.calcularEstatusPropiedad();
        },

        actualizarEstiloSelect: function (campo, valor) {
            var $s = this.$el.find('#select-' + campo);
            $s.removeClass('select-verde select-amarillo select-rojo');
            $s.addClass(this.obtenerColorClassPorValor(campo, valor));
        },

        obtenerColorClassPorValor: function (campo, valor) {
            var verdes    = ['Exclusividad pura o total con contrato firmado', 'En rango', 'Ubicación atractiva', 'Alta demanda'];
            var amarillos = ['Exclusividad interna de CENTURY con contrato firmado', 'Cercano al rango de precio', 'Ubicación medianamente atractiva', 'Media demanda'];
            if (verdes.includes(valor))    return 'select-verde';
            if (amarillos.includes(valor)) return 'select-amarillo';
            return 'select-rojo';
        },

        actualizarEstadosOtros: function () {
            ['exclusividad', 'precio', 'ubicacion', 'demanda'].forEach(function (campo) {
                var valor = this.$el.find('#select-' + campo).val();
                if (valor) this.actualizarEstiloSelect(campo, valor);
            }.bind(this));
        },

        seleccionarRecaudoSemaforo: function (e) {
            if (!this.puedeEditar) return;
            
            var $t        = $(e.currentTarget);
            var recaudoId = $t.data('recaudo-id');
            var campoId   = $t.data('campo-id');
            var valor     = $t.data('valor');

            this.$el.find('[data-recaudo-id="' + recaudoId + '"][data-campo-id="' + campoId + '"]').removeClass('selected');
            $t.addClass('selected');

            if (campoId === 'legal')     this.valoresRecaudosLegal[recaudoId]     = valor;
            if (campoId === 'mercadeo')  this.valoresRecaudosMercadeo[recaudoId]  = valor;
            if (campoId === 'apoderado') this.valoresRecaudosApoderado[recaudoId] = valor;

            this.calcularNotasPorcentajes();
        },

        calcularNotasPorcentajes: function () {
            if (!this.puedeEditar) return;
            
            this.calcularPorcentajeLegal();
            this.calcularPorcentajeMercadeo();
            this.calcularEstatusPropiedad();
        },

        calcularPorcentajeLegal: function () {
            var lista  = this.obtenerListaActual('legal');
            var total  = lista.mostrados.length;
            if (total === 0) { this.$el.find('#nota-legal').html('<span class="badge-color" style="background:#e74c3c;"></span>'); return; }
            var comp   = lista.mostrados.filter(function (r) { return this.valoresRecaudosLegal[r.id] === 'Adecuado'; }.bind(this)).length;
            var pct    = Math.round((comp / total) * 100);
            var color  = pct >= 90 ? '#27ae60' : (pct >= 80 ? '#f39c12' : '#e74c3c');
            this.$el.find('#nota-legal').html('<span class="badge-color" style="background:' + color + ';"></span>');
        },

        calcularPorcentajeMercadeo: function () {
            var lista  = this.listasRecaudos.mercadeo;
            var total  = lista.mostrados.length;
            if (total === 0) { this.$el.find('#nota-mercadeo').html('<span class="badge-color" style="background:#e74c3c;"></span>'); return; }
            var comp   = lista.mostrados.filter(function (r) { return this.valoresRecaudosMercadeo[r.id] === 'Adecuado'; }.bind(this)).length;
            var pct    = Math.round((comp / total) * 100);
            var color  = pct >= 90 ? '#27ae60' : (pct >= 70 ? '#f39c12' : '#e74c3c');
            this.$el.find('#nota-mercadeo').html('<span class="badge-color" style="background:' + color + ';"></span>');
        },

        calcularEstatusPropiedad: function () {
            var legalLista = this.obtenerListaActual('legal');
            var lComp = legalLista.mostrados.filter(function (r) {
                return this.valoresRecaudosLegal[r.id] === 'Adecuado';
            }.bind(this)).length;
            var lPct = legalLista.mostrados.length > 0
                ? Math.round((lComp / legalLista.mostrados.length) * 100) : 0;
            var estLegal = lPct >= 90 ? 'Verde' : (lPct >= 70 ? 'Amarillo' : 'Rojo');

            var mLista = this.listasRecaudos.mercadeo;
            var mComp = mLista.mostrados.filter(function (r) {
                return this.valoresRecaudosMercadeo[r.id] === 'Adecuado';
            }.bind(this)).length;
            var mPct = mLista.mostrados.length > 0
                ? Math.round((mComp / mLista.mostrados.length) * 100) : 0;
            var estMercadeo = mPct >= 90 ? 'Verde' : (mPct >= 70 ? 'Amarillo' : 'Rojo');

            var precio = this.$el.find('#select-precio').val();
            var estPrecio = precio === 'En rango'
                ? 'Verde'
                : (precio === 'Cercano al rango de precio' ? 'Amarillo' : 'Rojo');

            var excl = this.$el.find('#select-exclusividad').val();
            var estExclusiva = excl === 'Exclusividad pura o total con contrato firmado'
                ? 'Verde'
                : (excl === 'Exclusividad interna de CENTURY con contrato firmado' ? 'Amarillo' : 'Rojo');

            var ubic = this.$el.find('#select-ubicacion').val();
            var estUbicacion = ubic === 'Ubicación atractiva'
                ? 'Verde'
                : (ubic === 'Ubicación medianamente atractiva' ? 'Amarillo' : 'Rojo');

            var items     = [estLegal, estMercadeo, estPrecio, estExclusiva, estUbicacion];
            var verdes    = items.filter(function (v) { return v === 'Verde';    }).length;
            var amarillos = items.filter(function (v) { return v === 'Amarillo'; }).length;
            var rojos     = items.filter(function (v) { return v === 'Rojo';     }).length;

            var estatus;
            if (verdes >= 4) {
                estatus = 'Verde';
            } else if (verdes === 3) {
                estatus = 'Amarillo';
            } else if (verdes === 2) {
                estatus = rojos >= 2 ? 'Rojo' : 'Amarillo';
            } else {
                estatus = 'Rojo';
            }

            this.estatusPropiedad = estatus;
            return estatus;
        },

        guardarInventario: function () {
            if (!this.puedeEditar) {
                Espo.Ui.warning('No tiene permisos para guardar');
                return;
            }
            
            if (!this.inventarioId) { Espo.Ui.error('No hay inventario para guardar'); return; }

            var estatusPropiedad = this.calcularEstatusPropiedad();

            var data = {
                inventarioId:             this.inventarioId,
                tipoPersona:              this.$el.find('#tipoPersona').val(),
                buyer:                    this.$el.find('#buyerPersona').val(),
                buyerPersona:             this.$el.find('#buyerPersona').val(),
                subBuyers:                this.obtenerSubBuyersSeleccionados(),
                apoderado:                this.$el.find('input[name="apoderado"]:checked').val() === 'true',
                valoresRecaudosLegal:     this.valoresRecaudosLegal,
                valoresRecaudosMercadeo:  this.valoresRecaudosMercadeo,
                valoresRecaudosApoderado: this.valoresRecaudosApoderado,
                recaudosLegal:            this.obtenerRecaudosSeleccionados('legal'),
                recaudosMercadeo:         this.obtenerRecaudosSeleccionados('mercadeo'),
                recaudosApoderado:        this.obtenerRecaudosSeleccionados('apoderado'),
                demanda:                  this.$el.find('#select-demanda').val(),
                precio:                   this.$el.find('#select-precio').val(),
                ubicacion:                this.$el.find('#select-ubicacion').val(),
                exclusividad:             this.$el.find('#select-exclusividad').val(),
                estatusPropiedad:         estatusPropiedad,
            };

            var $btn = this.$el.find('[data-action="guardar"]');
            var orig = $btn.html();
            $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');

            var self = this;
            Espo.Ajax.postRequest('InvPropiedades/action/save', data)
                .then(function (response) {
                    if (response.success) {
                        Espo.Ui.success('Inventario guardado exitosamente');
                        setTimeout(function () {
                            // Volver con filtros después de guardar
                            var queryParams = [];
                            
                            if (self.filtrosRetorno.cla) queryParams.push('cla=' + encodeURIComponent(self.filtrosRetorno.cla));
                            if (self.filtrosRetorno.oficina) queryParams.push('oficina=' + encodeURIComponent(self.filtrosRetorno.oficina));
                            if (self.filtrosRetorno.asesor) queryParams.push('asesor=' + encodeURIComponent(self.filtrosRetorno.asesor));
                            if (self.filtrosRetorno.fechaDesde) queryParams.push('fechaDesde=' + encodeURIComponent(self.filtrosRetorno.fechaDesde));
                            if (self.filtrosRetorno.fechaHasta) queryParams.push('fechaHasta=' + encodeURIComponent(self.filtrosRetorno.fechaHasta));
                            if (self.filtrosRetorno.estatus) queryParams.push('estatus=' + encodeURIComponent(self.filtrosRetorno.estatus));
                            if (self.filtrosRetorno.pagina) queryParams.push('pagina=' + self.filtrosRetorno.pagina);
                            
                            var queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
                            var ruta = '#InvLista' + queryString;
                            
                            self.getRouter().navigate(ruta, { trigger: true });
                        }, 1000);
                    } else {
                        Espo.Ui.error(response.error || 'Error al guardar');
                        $btn.prop('disabled', false).html(orig);
                    }
                })
                .catch(function () {
                    Espo.Ui.error('Error al guardar inventario');
                    $btn.prop('disabled', false).html(orig);
                });
        },

        obtenerRecaudosSeleccionados: function (campoId) {
            var lista   = this.obtenerListaActual(campoId);
            return lista.mostrados.map(function (r) {
                var estado = campoId === 'legal'     ? this.valoresRecaudosLegal[r.id] :
                             campoId === 'mercadeo'  ? this.valoresRecaudosMercadeo[r.id] :
                             this.valoresRecaudosApoderado[r.id];
                return { recaudoId: r.id, estado: estado || 'Modificar/No Tiene' };
            }.bind(this));
        },

        mostrarModalCrearRecaudo: function (tipo) {
            if (!this.puedeEditar) return;
            if (this.modalCrearRecaudo) this.modalCrearRecaudo.mostrar(tipo);
        },

        mostrarInfoRecaudoModal: function (e) {
            var infoTexto    = $(e.currentTarget).data('info');
            var recaudoTexto = $(e.currentTarget).data('recaudo-texto');
            if (!infoTexto) return;

            var modalId = 'infoRecaudoModal';
            var $modal  = $('#' + modalId);
            if ($modal.length === 0) {
                $('body').append(
                    '<div class="modal fade" id="' + modalId + '" tabindex="-1" role="dialog">' +
                    '<div class="modal-dialog modal-lg"><div class="modal-content">' +
                    '<div class="modal-header"><button type="button" class="close" data-dismiss="modal">&times;</button>' +
                    '<h4 class="modal-title"><i class="fas fa-info-circle"></i> Información del Recaudo</h4></div>' +
                    '<div class="modal-body"><h5>Recaudo:</h5><p class="info-recaudo-texto"></p>' +
                    '<h5>Descripción:</h5><div class="info-contenido-texto"></div></div>' +
                    '<div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button></div>' +
                    '</div></div></div>'
                );
                $modal = $('#' + modalId);
            }
            $modal.find('.info-recaudo-texto').text(recaudoTexto);
            $modal.find('.info-contenido-texto').html(infoTexto.replace(/\n/g, '<br>'));
            $modal.modal('show');
        },

        inicializarTooltipsRecaudos: function () {
            this.$el.find('[data-toggle="tooltip"]').tooltip({ placement: 'top', html: true, container: 'body', trigger: 'hover' });
        },

        escapeHtml: function (text) {
            if (!text) return '';
            return text.toString().replace(/[&<>"']/g, function (m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
            });
        },

        data: function () { return {}; }
    });
});