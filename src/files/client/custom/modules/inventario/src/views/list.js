define('inventario:views/list', [
    'view',
    'inventario:views/modules/permisos'
], function (Dep, PermisosManager) {

    return Dep.extend({

        template: 'inventario:list',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.permisosManager = new PermisosManager(this);

            // Cargar filtros desde URL
            this.filtrosDesdeUrl = this.parseQueryParams();

            this.filtros = {
                cla: this.filtrosDesdeUrl.cla || null,
                oficina: this.filtrosDesdeUrl.oficina || null,
                asesor: this.filtrosDesdeUrl.asesor || null,
                fechaDesde: this.filtrosDesdeUrl.fechaDesde || null,
                fechaHasta: this.filtrosDesdeUrl.fechaHasta || null,
                estatus: this.filtrosDesdeUrl.estatus || null
            };

            this.propiedadesPagina   = [];
            this.inventarioData      = {};
            this.paginacion          = { pagina: 1, porPagina: 25, total: 0, totalPaginas: 0 };
            this.cargandoPagina      = false;

            this.cargarPermisos();
        },

        // Parsear query parameters de la URL
        parseQueryParams: function() {
            var hash = window.location.hash;
            var filtros = {
                cla: null,
                oficina: null,
                asesor: null,
                fechaDesde: null,
                fechaHasta: null,
                estatus: null,
                pagina: 1
            };
            
            if (hash && hash.includes('?')) {
                var queryString = hash.split('?')[1];
                var params = new URLSearchParams(queryString);
                
                filtros.cla = params.get('cla');
                filtros.oficina = params.get('oficina');
                filtros.asesor = params.get('asesor');
                filtros.fechaDesde = params.get('fechaDesde');
                filtros.fechaHasta = params.get('fechaHasta');
                filtros.estatus = params.get('estatus');
                filtros.pagina = params.get('pagina') ? parseInt(params.get('pagina'), 10) : 1;
            }
            
            return filtros;
        },

        // Actualizar URL con filtros actuales
        actualizarUrlConFiltros: function() {
            var queryParams = [];
            
            if (this.filtros.cla) queryParams.push('cla=' + encodeURIComponent(this.filtros.cla));
            if (this.filtros.oficina) queryParams.push('oficina=' + encodeURIComponent(this.filtros.oficina));
            if (this.filtros.asesor) queryParams.push('asesor=' + encodeURIComponent(this.filtros.asesor));
            if (this.filtros.fechaDesde) queryParams.push('fechaDesde=' + encodeURIComponent(this.filtros.fechaDesde));
            if (this.filtros.fechaHasta) queryParams.push('fechaHasta=' + encodeURIComponent(this.filtros.fechaHasta));
            if (this.filtros.estatus) queryParams.push('estatus=' + encodeURIComponent(this.filtros.estatus));
            if (this.paginacion.pagina > 1) queryParams.push('pagina=' + this.paginacion.pagina);
            
            var queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
            var nuevaUrl = '#InvLista' + queryString;
            
            // Actualizar URL sin recargar la página
            this.getRouter().navigate(nuevaUrl, { trigger: false });
        },

        cargarPermisos: function () {
            this.permisosManager.cargarPermisosUsuario()
                .then(function (permisos) {
                    this.permisos = permisos;
                    
                    // Establecer valores de filtros simples primero
                    this.$el.find('#filtro-fecha-desde').val(this.filtros.fechaDesde || '');
                    this.$el.find('#filtro-fecha-hasta').val(this.filtros.fechaHasta || '');
                    this.$el.find('#filtro-estatus').val(this.filtros.estatus || '');
                    
                    return this.cargarFiltros();
                }.bind(this))
                .then(function () {
                    // Después de cargar todos los filtros, aplicar los valores de URL
                    return this.aplicarValoresFiltrosDesdeUrl();
                }.bind(this))
                .then(function () {
                    if (this.filtrosDesdeUrl.pagina) {
                        this.paginacion.pagina = this.filtrosDesdeUrl.pagina;
                    }
                    this.cargarPropiedadesIniciales();
                }.bind(this))
                .catch(function (error) {
                    console.error('Error cargando permisos:', error);
                    this.fetchPropiedades({});
                }.bind(this));
        },

        aplicarValoresFiltrosDesdeUrl: function () {
            var self = this;
            return new Promise(function (resolve) {
                // Primero aplicar CLA si existe
                if (self.filtros.cla) {
                    var $claSelect = self.$el.find('#filtro-cla');
                    
                    var checkCLA = function() {
                        if ($claSelect.find('option[value="' + self.filtros.cla + '"]').length) {
                            $claSelect.val(self.filtros.cla);
                            
                            // Disparar cambio para cargar oficinas
                            self.onCLAChange(self.filtros.cla).then(function() {
                                // Después de cargar oficinas, aplicar oficina si existe
                                if (self.filtros.oficina) {
                                    self.aplicarOficinaDesdeUrl().then(resolve);
                                } else {
                                    resolve();
                                }
                            });
                        } else {
                            setTimeout(checkCLA, 100);
                        }
                    };
                    checkCLA();
                } else if (self.filtros.oficina) {
                    // Si hay oficina pero no CLA, aplicar directamente
                    self.aplicarOficinaDesdeUrl().then(resolve);
                } else {
                    resolve();
                }
            });
        },

        aplicarOficinaDesdeUrl: function () {
            var self = this;
            return new Promise(function (resolve) {
                if (!self.filtros.oficina) {
                    resolve();
                    return;
                }
                
                var $oficinaSelect = self.$el.find('#filtro-oficina');
                
                var checkOficina = function() {
                    if ($oficinaSelect.find('option[value="' + self.filtros.oficina + '"]').length) {
                        $oficinaSelect.val(self.filtros.oficina);
                        
                        // Disparar cambio para cargar asesores
                        self.onOficinaChange(self.filtros.oficina).then(function() {
                            // Después de cargar asesores, aplicar asesor si existe
                            if (self.filtros.asesor) {
                                self.aplicarAsesorDesdeUrl();
                            }
                            resolve();
                        });
                    } else {
                        setTimeout(checkOficina, 100);
                    }
                };
                checkOficina();
            });
        },

        aplicarAsesorDesdeUrl: function () {
            var self = this;
            if (!self.filtros.asesor) return;
            
            var $asesorSelect = self.$el.find('#filtro-asesor');
            
            var checkAsesor = function() {
                if ($asesorSelect.find('option[value="' + self.filtros.asesor + '"]').length) {
                    $asesorSelect.val(self.filtros.asesor);
                } else {
                    setTimeout(checkAsesor, 100);
                }
            };
            checkAsesor();
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            this.setupEventListeners();
            this.aplicarVisibilidadFiltros();
        },

        aplicarVisibilidadFiltros: function () {
            if (!this.permisos) return;
            var p = this.permisos;

            // Casa Nacional: ve todos los filtros
            if (p.esCasaNacional) {
                this.$el.find('#filtro-cla-group, #filtro-oficina-group, #filtro-asesor-group').show();
                return;
            }

            // Director/Gerente: ve asesor, fechas, estatus
            if (p.esGerente || p.esDirector || p.esCoordinador) {
                this.$el.find('#filtro-cla-group, #filtro-oficina-group').hide();
                this.$el.find('#filtro-asesor-group').show();
                return;
            }

            // Asesor (y otros): solo ve fechas y estatus
            this.$el.find('#filtro-cla-group, #filtro-oficina-group, #filtro-asesor-group').hide();
        },

        setupEventListeners: function () {
            var self = this;

            this.$el.find('[data-action="aplicar-filtros"]').on('click', function () {
                self.paginacion.pagina = 1;
                self.aplicarFiltros();
            });

            this.$el.find('[data-action="limpiar-filtros"]').on('click', function () {
                self.limpiarFiltros();
            });

            this.$el.find('#filtro-cla').on('change', function (e) {
                var claId = $(e.currentTarget).val();
                self.onCLAChange(claId).then(function() {
                    // Si hay filtro de oficina en URL, aplicarlo después de cargar
                    if (self.filtros.oficina) {
                        self.aplicarOficinaDesdeUrl();
                    }
                });
            });

            this.$el.find('#filtro-oficina').on('change', function (e) {
                var oficinaId = $(e.currentTarget).val();
                self.onOficinaChange(oficinaId).then(function() {
                    // Si hay filtro de asesor en URL, aplicarlo después de cargar
                    if (self.filtros.asesor) {
                        self.aplicarAsesorDesdeUrl();
                    }
                });
            });
        },

        // ========== FILTROS ==========

        cargarFiltros: function () {
            var p = this.permisos;
            var self = this;

            return new Promise(function (resolve) {
                if (!p) {
                    resolve();
                    return;
                }

                // Si es Casa Nacional, cargar todos los CLAs normalmente
                if (p.esCasaNacional) {
                    self.cargarTodosCLAs().then(resolve);
                    return;
                }

                // Si es Director/Gerente
                if (p.esGerente || p.esDirector || p.esCoordinador) {
                    self.filtros.oficina = p.oficinaUsuario;
                    
                    // Mostrar CLA bloqueado si tiene uno
                    if (p.claUsuario) {
                        var $cla = self.$el.find('#filtro-cla');
                        $cla.empty().append('<option value="' + p.claUsuario + '">' + (p.claNombre || 'CLA asignado') + '</option>');
                        $cla.prop('disabled', true);
                    } else {
                        var $cla = self.$el.find('#filtro-cla');
                        $cla.empty().append('<option value="">Sin CLA asignado</option>');
                        $cla.prop('disabled', true);
                    }
                    
                    // Mostrar Oficina bloqueada
                    if (p.oficinaUsuario) {
                        var $oficina = self.$el.find('#filtro-oficina');
                        $oficina.empty().append('<option value="' + p.oficinaUsuario + '">' + (p.oficinaNombre || 'Oficina asignada') + '</option>');
                        $oficina.prop('disabled', true);
                        
                        // Cargar asesores de esa oficina
                        self.cargarAsesoresPorOficina(p.oficinaUsuario).then(resolve);
                    } else {
                        resolve();
                    }
                    return;
                }

                // Si es Asesor (o tratado como asesor)
                if (p.esAsesor) {
                    self.filtros.asesor = p.usuarioId;
                    
                    // Mostrar CLA bloqueado si tiene uno
                    if (p.claUsuario) {
                        var $cla = self.$el.find('#filtro-cla');
                        $cla.empty().append('<option value="' + p.claUsuario + '">' + (p.claNombre || 'CLA asignado') + '</option>');
                        $cla.prop('disabled', true);
                    } else {
                        var $cla = self.$el.find('#filtro-cla');
                        $cla.empty().append('<option value="">Sin CLA asignado</option>');
                        $cla.prop('disabled', true);
                    }
                    
                    // Mostrar Oficina bloqueada
                    if (p.oficinaUsuario) {
                        var $oficina = self.$el.find('#filtro-oficina');
                        $oficina.empty().append('<option value="' + p.oficinaUsuario + '">' + (p.oficinaNombre || 'Oficina asignada') + '</option>');
                        $oficina.prop('disabled', true);
                    } else {
                        var $oficina = self.$el.find('#filtro-oficina');
                        $oficina.empty().append('<option value="">Sin oficina asignada</option>');
                        $oficina.prop('disabled', true);
                    }
                    
                    // Mostrar Asesor bloqueado (él mismo)
                    var $asesor = self.$el.find('#filtro-asesor');
                    $asesor.empty().append('<option value="' + p.usuarioId + '">' + (p.userName || 'Usuario actual') + '</option>');
                    $asesor.prop('disabled', true);
                    
                    resolve();
                } else {
                    resolve();
                }
            });
        },

        cargarTodosCLAs: function () {
            var self = this;
            return new Promise(function (resolve) {
                Espo.Ajax.getRequest('InvLista/action/getCLAs')
                    .then(function (response) {
                        if (response.success) {
                            self.poblarSelectCLAs(response.data);
                        }
                        resolve();
                    }.bind(this))
                    .catch(function() {
                        resolve();
                    });
            });
        },

        poblarSelectCLAs: function (clas) {
            var select = this.$el.find('#filtro-cla');
            select.empty().append('<option value="">Todos los CLAs</option>');
            clas.forEach(function (cla) {
                select.append('<option value="' + cla.id + '">' + cla.name + '</option>');
            });
        },

        onCLAChange: function (claId) {
            var self = this;
            return new Promise(function (resolve) {
                var selectOficina = self.$el.find('#filtro-oficina');
                var selectAsesor  = self.$el.find('#filtro-asesor');

                selectOficina.html('<option value="">Cargando...</option>').prop('disabled', true);
                selectAsesor.html('<option value="">Todos los asesores</option>').prop('disabled', true);

                if (!claId) {
                    selectOficina.html('<option value="">Seleccione un CLA primero</option>');
                    resolve();
                    return;
                }

                Espo.Ajax.getRequest('InvLista/action/getOficinasByCLA', { claId: claId })
                    .then(function (response) {
                        if (response.success) {
                            self.poblarSelectOficinas(response.data);
                        }
                        resolve();
                    })
                    .catch(function() {
                        resolve();
                    });
            });
        },

        poblarSelectOficinas: function (oficinas) {
            var select = this.$el.find('#filtro-oficina');
            select.empty().append('<option value="">Todas las oficinas</option>');
            oficinas.forEach(function (o) {
                select.append('<option value="' + o.id + '">' + o.name + '</option>');
            });
            select.prop('disabled', false);
        },

        onOficinaChange: function (oficinaId) {
            var self = this;
            return new Promise(function (resolve) {
                var selectAsesor = self.$el.find('#filtro-asesor');
                selectAsesor.html('<option value="">Cargando...</option>').prop('disabled', true);

                if (!oficinaId) {
                    selectAsesor.html('<option value="">Todos los asesores</option>').prop('disabled', false);
                    resolve();
                    return;
                }

                self.cargarAsesoresPorOficina(oficinaId).then(resolve);
            });
        },

        cargarAsesoresPorOficina: function (oficinaId) {
            var self = this;
            return new Promise(function (resolve) {
                Espo.Ajax.getRequest('InvLista/action/getAsesoresByOficina', { oficinaId: oficinaId })
                    .then(function (response) {
                        if (response.success) {
                            self.poblarSelectAsesores(response.data);
                        } else {
                            console.error('Error asesores:', response.error);
                            self.$el.find('#filtro-asesor')
                                .html('<option value="">Error al cargar asesores</option>')
                                .prop('disabled', false);
                        }
                        resolve();
                    })
                    .catch(function (err) {
                        console.error('Error cargando asesores:', err);
                        self.$el.find('#filtro-asesor')
                            .html('<option value="">Error al cargar asesores</option>')
                            .prop('disabled', false);
                        resolve();
                    });
            });
        },

        poblarSelectAsesores: function (asesores) {
            var select = this.$el.find('#filtro-asesor');
            select.empty().append('<option value="">Todos los asesores</option>');
            if (asesores && asesores.length > 0) {
                asesores.forEach(function (a) {
                    select.append('<option value="' + a.id + '">' + a.name + '</option>');
                });
            } else {
                select.append('<option value="" disabled>Sin asesores en esta oficina</option>');
            }
            select.prop('disabled', false);
        },

        // ========== CARGA DE PROPIEDADES ==========

        cargarPropiedadesIniciales: function () {
            var params = { 
                pagina: this.paginacion.pagina,
                userId: this.getUser().id
            };
            var p = this.permisos;

            if (!p) {
                this.fetchPropiedades(params);
                return;
            }

            // Aplicar filtros desde URL si existen
            if (this.filtros.cla) params.claId = this.filtros.cla;
            if (this.filtros.oficina) params.oficinaId = this.filtros.oficina;
            if (this.filtros.asesor) params.asesorId = this.filtros.asesor;
            if (this.filtros.fechaDesde) params.fechaDesde = this.filtros.fechaDesde;
            if (this.filtros.fechaHasta) params.fechaHasta = this.filtros.fechaHasta;
            if (this.filtros.estatus) params.estatus = this.filtros.estatus;

            // Si no hay filtros manuales, aplicar filtros automáticos por rol
            if (!params.claId && !params.oficinaId && !params.asesorId) {
                if (p.esCasaNacional) {
                    // No añadir nada
                } else if (p.esGerente || p.esDirector || p.esCoordinador) {
                    if (p.oficinaUsuario) params.oficinaId = p.oficinaUsuario;
                } else if (p.esAsesor) {
                    params.asesorId = p.usuarioId;
                }
            }

            this.fetchPropiedades(params);
        },

        aplicarFiltros: function () {
            // Leer filtros del DOM
            var cla     = this.$el.find('#filtro-cla').val()     || null;
            var oficina = this.$el.find('#filtro-oficina').val() || null;
            var asesor  = this.$el.find('#filtro-asesor').val()  || null;
            var estatus = this.$el.find('#filtro-estatus').val() || null;

            this.filtros = {
                cla:       cla,
                oficina:   oficina,
                asesor:    asesor,
                fechaDesde: this.$el.find('#filtro-fecha-desde').val() || null,
                fechaHasta: this.$el.find('#filtro-fecha-hasta').val() || null,
                estatus:   estatus
            };

            // Respetar restricciones de rol
            var p = this.permisos;
            if (p) {
                if (p.esAsesor) {
                    this.filtros.asesor  = p.usuarioId;
                    this.filtros.cla     = null;
                    this.filtros.oficina = null;
                } else if (p.esGerente || p.esDirector || p.esCoordinador) {
                    this.filtros.oficina = p.oficinaUsuario;
                    this.filtros.cla     = null;
                }
            }

            this.paginacion.pagina = 1;
            
            // Actualizar URL con los nuevos filtros
            this.actualizarUrlConFiltros();
            
            this.fetchConFiltrosActuales();
        },

        limpiarFiltros: function () {
            this.$el.find('#filtro-cla').val('');
            this.$el.find('#filtro-oficina').val('').prop('disabled', true)
                .html('<option value="">Seleccione un CLA primero</option>');
            this.$el.find('#filtro-asesor').val('').prop('disabled', true)
                .html('<option value="">Todos los asesores</option>');
            this.$el.find('#filtro-fecha-desde').val('');
            this.$el.find('#filtro-fecha-hasta').val('');
            this.$el.find('#filtro-estatus').val('');

            this.filtros = { 
                cla: null, 
                oficina: null, 
                asesor: null, 
                fechaDesde: null, 
                fechaHasta: null,
                estatus: null
            };
            this.paginacion.pagina = 1;
            
            // Actualizar URL (quitar filtros)
            this.actualizarUrlConFiltros();
            
            this.cargarPropiedadesIniciales();
        },

        fetchConFiltrosActuales: function (pagina) {
            var params = { 
                pagina: pagina || this.paginacion.pagina,
                userId: this.getUser().id
            };
            if (this.filtros.cla)        params.claId      = this.filtros.cla;
            if (this.filtros.oficina)    params.oficinaId  = this.filtros.oficina;
            if (this.filtros.asesor)     params.asesorId   = this.filtros.asesor;
            if (this.filtros.fechaDesde) params.fechaDesde = this.filtros.fechaDesde;
            if (this.filtros.fechaHasta) params.fechaHasta = this.filtros.fechaHasta;
            if (this.filtros.estatus)    params.estatus    = this.filtros.estatus;
            this.fetchPropiedades(params);
        },

        fetchPropiedades: function (params) {
            if (this.cargandoPagina) return;
            this.cargandoPagina = true;

            var container = this.$el.find('#inventario-container');
            container.html(this.spinnerHTML());

            var self = this;
            Espo.Ajax.getRequest('InvLista/action/getPropiedades', params)
                .then(function (response) {
                    self.cargandoPagina = false;
                    if (response.success) {
                        self.propiedadesPagina = response.data || [];
                        self.paginacion = response.paginacion || self.paginacion;
                        self.cargarInventarioData(self.propiedadesPagina);
                    } else {
                        container.html('<div class="alert alert-danger">Error: ' + (response.error || 'desconocido') + '</div>');
                    }
                })
                .catch(function (error) {
                    self.cargandoPagina = false;
                    console.error('Error cargando propiedades:', error);
                    container.html('<div class="alert alert-danger">Error al cargar propiedades</div>');
                });
        },

        cargarInventarioData: function (propiedades) {
            var propiedadIds = propiedades.map(function (p) { return p.id; });

            if (propiedadIds.length === 0) {
                this.renderizarTabla();
                return;
            }

            var self = this;
            Espo.Ajax.postRequest('InvLista/action/getInventarioData', { propiedadIds: propiedadIds })
                .then(function (response) {
                    if (response.success) self.inventarioData = response.data;
                    self.renderizarTabla();
                })
                .catch(function () {
                    self.renderizarTabla();
                });
        },

        irAPagina: function (pagina) {
            if (pagina < 1 || pagina > this.paginacion.totalPaginas || this.cargandoPagina) return;
            this.paginacion.pagina = pagina;
            
            // Actualizar URL con nueva página
            this.actualizarUrlConFiltros();
            
            this.fetchConFiltrosActuales(pagina);
        },

        // ========== RENDER ==========

        spinnerHTML: function () {
            return '<div class="text-center" style="padding:80px 20px;">' +
                   '<div class="spinner-large"></div>' +
                   '<h4 style="color:#1A1A1A;font-weight:600;margin-top:20px;">Cargando inventario...</h4>' +
                   '<p style="color:#666;">Obteniendo datos del servidor</p></div>';
        },

        calcularDias: function (fechaAlta) {
            if (!fechaAlta) return '-';
            
            var hoy = new Date();
            var fecha = new Date(fechaAlta);
            
            hoy.setHours(0, 0, 0, 0);
            fecha.setHours(0, 0, 0, 0);
            
            var diffTime = hoy.getTime() - fecha.getTime();
            var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays + ' días';
        },

        colorDias: function (diasTexto) {
            var match = diasTexto.match(/(\d+)/);
            if (!match) return '#95a5a6';
            var dias = parseInt(match[0], 10);
            
            if (dias < 90) return '#27ae60';
            if (dias <= 150) return '#f39c12';
            return '#e74c3c';
        },

        colorEstatus: function (e) {
            return e === 'Verde' ? '#27ae60' : e === 'Amarillo' ? '#f39c12' : e === 'Rojo' ? '#e74c3c' : '#95a5a6';
        },

        colorDemanda: function (d) {
            return d === 'Alta demanda' ? '#27ae60' : d === 'Media demanda' ? '#f39c12' : d === 'Baja demanda' ? '#e74c3c' : '#95a5a6';
        },

        renderizarTabla: function () {
            var self      = this;
            var container = this.$el.find('#inventario-container');
            var pag       = this.paginacion;

            var inicio = pag.total === 0 ? 0 : (pag.pagina - 1) * pag.porPagina + 1;
            var fin    = Math.min(pag.pagina * pag.porPagina, pag.total);
            this.$el.find('#total-propiedades-mostradas')
                .text(pag.total === 0 ? '0' : inicio + '–' + fin + ' de ' + pag.total);

            if (this.propiedadesPagina.length === 0) {
                container.html(
                    '<div class="no-data-card">' +
                    '<div class="no-data-icon"><i class="fas fa-home"></i></div>' +
                    '<h3 class="no-data-title">No hay propiedades</h3>' +
                    '<p class="no-data-text">No se encontraron propiedades con los filtros actuales</p>' +
                    '</div>'
                );
                return;
            }

            var inicioPagina = (pag.pagina - 1) * pag.porPagina;

            var html = '<div class="tabla-wrapper">';
            html += '<table class="tabla-propiedades">';
            html += '<thead><tr>';
            html += '<th style="width:50px;text-align:center;">N°</th>';
            html += '<th style="width:90px;">Días</th>';
            html += '<th style="min-width:180px;">Dirección</th>';
            html += '<th style="min-width:140px;">Asesor</th>';
            html += '<th style="width:110px;">Tipo</th>';
            html += '<th style="width:100px;">Operación</th>';
            html += '<th style="width:80px;text-align:center;">Estatus</th>';
            html += '<th style="width:100px;text-align:center;">Demanda</th>';
            html += '<th style="min-width:140px;">Apoderado</th>';
            html += '<th style="width:60px;text-align:center;">Ver</th>';
            html += '</tr></thead><tbody>';

            this.propiedadesPagina.forEach(function (propiedad, index) {
                var numeroLinea = inicioPagina + index + 1;
                var inv        = self.inventarioData[propiedad.id] || null;
                var estatus    = inv ? (inv.estatusPropiedad || 'Sin calcular') : 'Sin calcular';
                var demanda    = inv ? (inv.demanda || 'Sin definir') : 'Sin definir';
                var cEstatus   = self.colorEstatus(estatus);
                var cDemanda   = self.colorDemanda(demanda);
                var dias       = self.calcularDias(propiedad.fechaAlta);
                var colorDias  = self.colorDias(dias);
                var partes     = [propiedad.calle, propiedad.numero, propiedad.urbanizacion].filter(Boolean);
                var direccion  = partes.join(' ') || '-';
                var asesor     = propiedad.asesorNombre || '-';
                var asesorShort = asesor.length > 22 ? asesor.substring(0, 20) + '…' : asesor;
                var apoCellId  = 'apo-' + propiedad.id;

                html += '<tr data-id="' + propiedad.id + '">';
                html += '<td style="text-align:center;font-weight:600;">' + numeroLinea + '</td>';
                html += '<td style="text-align:center;font-weight:600;color:white;background:' + colorDias + ';border-radius:4px;">' + dias + '</td>';
                html += '<td title="' + self.esc(direccion) + '" class="td-ellipsis">' + self.esc(direccion) + '</td>';
                html += '<td title="' + self.esc(asesor) + '" class="td-ellipsis">' + self.esc(asesorShort) + '</td>';
                html += '<td class="td-ellipsis">' + self.esc(propiedad.tipoPropiedad || '-') + '</td>';
                html += '<td class="td-ellipsis">' + self.esc(propiedad.tipoOperacion || '-') + '</td>';
                html += '<td style="text-align:center;">' +
                        '<span class="badge-estado" style="background:' + cEstatus + ';">' + self.esc(estatus) + '</span></td>';
                html += '<td style="text-align:center;">' +
                        '<span class="badge-estado" style="background:' + cDemanda + ';">' + self.esc(demanda) + '</span></td>';

                if (inv && inv.apoderado) {
                    html += '<td id="' + apoCellId + '" style="font-size:11px;"><span style="color:#999;">Cargando…</span></td>';
                } else {
                    html += '<td id="' + apoCellId + '" style="font-size:11px;color:#bbb;">Sin apoderado</td>';
                }

                html += '<td style="text-align:center;">';
                html += '<button class="btn-ver" data-id="' + propiedad.id + '" title="Ver inventario">';
                html += '<i class="fas fa-eye"></i></button>';
                html += '</td>';
                html += '</tr>';
            });

            html += '</tbody></table></div>';
            html += this.renderPaginacion();

            container.html(html);

            this.propiedadesPagina.forEach(function (propiedad) {
                var inv = self.inventarioData[propiedad.id];
                if (inv && inv.apoderado && inv.id) {
                    self.cargarRecaudosApoderado(inv.id, container.find('#apo-' + propiedad.id));
                }
            });

            container.find('tr[data-id]').on('click', function (e) {
                if (!$(e.target).closest('button').length) {
                    self.verDetalle($(this).data('id'));
                }
            });
            container.find('.btn-ver').on('click', function (e) {
                e.stopPropagation();
                self.verDetalle($(this).data('id'));
            });
            container.find('.pag-btn').on('click', function () {
                var p = parseInt($(this).data('pagina'), 10);
                if (!isNaN(p)) self.irAPagina(p);
            });
        },

        renderPaginacion: function () {
            var pag = this.paginacion;
            if (pag.totalPaginas <= 1) return '';

            var actual  = pag.pagina;
            var total   = pag.totalPaginas;
            var pages   = [];

            var rango = 2;
            var inicio = Math.max(2, actual - rango);
            var fin    = Math.min(total - 1, actual + rango);

            pages.push(1);
            if (inicio > 2) pages.push('...');
            for (var i = inicio; i <= fin; i++) pages.push(i);
            if (fin < total - 1) pages.push('...');
            if (total > 1) pages.push(total);

            var html = '<div class="paginacion-container">';
            html += '<div class="paginacion-info">Página ' + actual + ' de ' + total + '</div>';
            html += '<div class="paginacion-controles">';

            html += '<button class="pag-btn pag-nav' + (actual <= 1 ? ' disabled' : '') + '" data-pagina="' + (actual - 1) + '"' + (actual <= 1 ? ' disabled' : '') + '>';
            html += '<i class="fas fa-chevron-left"></i></button>';

            pages.forEach(function (p) {
                if (p === '...') {
                    html += '<span class="pag-ellipsis">…</span>';
                } else {
                    html += '<button class="pag-btn' + (p === actual ? ' pag-activo' : '') + '" data-pagina="' + p + '">' + p + '</button>';
                }
            });

            html += '<button class="pag-btn pag-nav' + (actual >= total ? ' disabled' : '') + '" data-pagina="' + (actual + 1) + '"' + (actual >= total ? ' disabled' : '') + '>';
            html += '<i class="fas fa-chevron-right"></i></button>';

            html += '</div></div>';
            return html;
        },

        cargarRecaudosApoderado: function (inventarioId, $cell) {
            Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosApoderado', { inventarioId: inventarioId })
                .then(function (response) {
                    if (response.success && response.data && response.data.recaudos && response.data.recaudos.length > 0) {
                        var tiene = response.data.recaudos.filter(function (r) { return r.estado === 'Adecuado'; });
                        if (tiene.length === 0) {
                            $cell.html('<span style="color:#999;">Sin recaudos</span>');
                        } else {
                            $cell.html(tiene.map(function (r) {
                                return '<div style="line-height:1.4;margin-bottom:2px;">• ' + r.name + '</div>';
                            }).join(''));
                        }
                    } else {
                        $cell.html('<span style="color:#bbb;">Sin recaudos</span>');
                    }
                })
                .catch(function () {
                    $cell.html('<span style="color:#e74c3c;">Error</span>');
                });
        },

        verDetalle: function (propiedadId) {
            // Pasar filtros actuales a la URL de propiedad
            var queryParams = [];
            
            if (this.filtros.cla) queryParams.push('cla=' + encodeURIComponent(this.filtros.cla));
            if (this.filtros.oficina) queryParams.push('oficina=' + encodeURIComponent(this.filtros.oficina));
            if (this.filtros.asesor) queryParams.push('asesor=' + encodeURIComponent(this.filtros.asesor));
            if (this.filtros.fechaDesde) queryParams.push('fechaDesde=' + encodeURIComponent(this.filtros.fechaDesde));
            if (this.filtros.fechaHasta) queryParams.push('fechaHasta=' + encodeURIComponent(this.filtros.fechaHasta));
            if (this.filtros.estatus) queryParams.push('estatus=' + encodeURIComponent(this.filtros.estatus));
            if (this.paginacion.pagina > 1) queryParams.push('pagina=' + this.paginacion.pagina);
            
            var queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
            var ruta = '#InvLista/propiedad/propiedadId=' + propiedadId + queryString;
            
            this.getRouter().navigate(ruta, { trigger: true });
        },

        esc: function (text) {
            if (!text) return '';
            return String(text).replace(/[&<>"']/g, function (m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
            });
        }
    });
});