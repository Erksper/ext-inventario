define('inventario:views/list', [
    'view',
    'inventario:views/modules/permisos'
], function (Dep, PermisosManager) {

    return Dep.extend({

        template: 'inventario:list',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.permisosManager = new PermisosManager(this);
            this.filtrosDesdeUrl = this.parseQueryParams();

            this.filtros = {
                cla:        this.filtrosDesdeUrl.cla        || null,
                oficina:    this.filtrosDesdeUrl.oficina    || null,
                asesor:     this.filtrosDesdeUrl.asesor     || null,
                fechaDesde: this.filtrosDesdeUrl.fechaDesde || null,
                fechaHasta: this.filtrosDesdeUrl.fechaHasta || null,
                estatus:    this.filtrosDesdeUrl.estatus    || null
            };

            this.propiedadesPagina = [];
            this.inventarioData    = {};
            this.paginacion        = { pagina: 1, porPagina: 25, total: 0, totalPaginas: 0 };
            this.cargandoPagina    = false;

            this.cargarPermisos();
        },

        parseQueryParams: function () {
            var hash = window.location.hash;
            var filtros = { cla: null, oficina: null, asesor: null, fechaDesde: null, fechaHasta: null, estatus: null, pagina: 1 };
            if (hash && hash.includes('?')) {
                var params = new URLSearchParams(hash.split('?')[1]);
                filtros.cla        = params.get('cla');
                filtros.oficina    = params.get('oficina');
                filtros.asesor     = params.get('asesor');
                filtros.fechaDesde = params.get('fechaDesde');
                filtros.fechaHasta = params.get('fechaHasta');
                filtros.estatus    = params.get('estatus');
                filtros.pagina     = params.get('pagina') ? parseInt(params.get('pagina'), 10) : 1;
            }
            return filtros;
        },

        actualizarUrlConFiltros: function () {
            var qp = [];
            if (this.filtros.cla)        qp.push('cla='        + encodeURIComponent(this.filtros.cla));
            if (this.filtros.oficina)    qp.push('oficina='    + encodeURIComponent(this.filtros.oficina));
            if (this.filtros.asesor)     qp.push('asesor='     + encodeURIComponent(this.filtros.asesor));
            if (this.filtros.fechaDesde) qp.push('fechaDesde=' + encodeURIComponent(this.filtros.fechaDesde));
            if (this.filtros.fechaHasta) qp.push('fechaHasta=' + encodeURIComponent(this.filtros.fechaHasta));
            if (this.filtros.estatus)    qp.push('estatus='    + encodeURIComponent(this.filtros.estatus));
            if (this.paginacion.pagina > 1) qp.push('pagina=' + this.paginacion.pagina);
            this.getRouter().navigate('#InvLista' + (qp.length ? '?' + qp.join('&') : ''), { trigger: false });
        },

        cargarPermisos: function () {
            this.permisosManager.cargarPermisosUsuario()
                .then(function (permisos) {
                    this.permisos = permisos;
                    this.$el.find('#filtro-fecha-desde').val(this.filtros.fechaDesde || '');
                    this.$el.find('#filtro-fecha-hasta').val(this.filtros.fechaHasta || '');
                    this.$el.find('#filtro-estatus').val(this.filtros.estatus || '');
                    return this.cargarFiltros();
                }.bind(this))
                .then(function () {
                    return this.aplicarValoresFiltrosDesdeUrl();
                }.bind(this))
                .then(function () {
                    if (this.filtrosDesdeUrl.pagina) this.paginacion.pagina = this.filtrosDesdeUrl.pagina;
                    this.cargarPropiedadesIniciales();
                }.bind(this))
                .catch(function (error) {
                    this.fetchPropiedades({});
                }.bind(this));
        },

        aplicarValoresFiltrosDesdeUrl: function () {
            var self = this;
            return new Promise(function (resolve) {
                if (self.filtros.cla) {
                    var $cla = self.$el.find('#filtro-cla');
                    var checkCLA = function () {
                        if ($cla.find('option[value="' + self.filtros.cla + '"]').length) {
                            $cla.val(self.filtros.cla);
                            self.onCLAChange(self.filtros.cla).then(function () {
                                if (self.filtros.oficina) self.aplicarOficinaDesdeUrl().then(resolve);
                                else resolve();
                            });
                        } else { setTimeout(checkCLA, 100); }
                    };
                    checkCLA();
                } else if (self.filtros.oficina) {
                    self.aplicarOficinaDesdeUrl().then(resolve);
                } else {
                    resolve();
                }
            });
        },

        aplicarOficinaDesdeUrl: function () {
            var self = this;
            return new Promise(function (resolve) {
                if (!self.filtros.oficina) { resolve(); return; }
                var $of = self.$el.find('#filtro-oficina');
                var checkOf = function () {
                    if ($of.find('option[value="' + self.filtros.oficina + '"]').length) {
                        $of.val(self.filtros.oficina);
                        self.onOficinaChange(self.filtros.oficina).then(function () {
                            if (self.filtros.asesor) self.aplicarAsesorDesdeUrl();
                            resolve();
                        });
                    } else { setTimeout(checkOf, 100); }
                };
                checkOf();
            });
        },

        aplicarAsesorDesdeUrl: function () {
            var self = this;
            if (!self.filtros.asesor) return;
            var $as = self.$el.find('#filtro-asesor');
            var checkAs = function () {
                if ($as.find('option[value="' + self.filtros.asesor + '"]').length) {
                    $as.val(self.filtros.asesor);
                } else { setTimeout(checkAs, 100); }
            };
            checkAs();
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.setupEventListeners();
            this.aplicarVisibilidadFiltros();
        },

        aplicarVisibilidadFiltros: function () {
            if (!this.permisos) return;
            var p = this.permisos;
            if (p.esCasaNacional) {
                this.$el.find('#filtro-cla-group, #filtro-oficina-group, #filtro-asesor-group').show();
                return;
            }
            if (p.esGerente || p.esDirector || p.esCoordinador) {
                this.$el.find('#filtro-cla-group, #filtro-oficina-group').hide();
                this.$el.find('#filtro-asesor-group').show();
                return;
            }
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
                self.onCLAChange($(e.currentTarget).val()).then(function () {
                    if (self.filtros.oficina) self.aplicarOficinaDesdeUrl();
                });
            });
            this.$el.find('#filtro-oficina').on('change', function (e) {
                self.onOficinaChange($(e.currentTarget).val()).then(function () {
                    if (self.filtros.asesor) self.aplicarAsesorDesdeUrl();
                });
            });
        },

        cargarFiltros: function () {
            var p = this.permisos, self = this;
            return new Promise(function (resolve) {
                if (!p) { resolve(); return; }
                if (p.esCasaNacional) {
                    self.cargarTodosCLAs().then(resolve);
                    return;
                }
                if (p.esGerente || p.esDirector || p.esCoordinador) {
                    if (p.oficinaUsuario === '1') {
                        self.$el.find('#filtro-oficina').empty().append('<option value="">Oficina no disponible</option>').prop('disabled', true);
                        self.$el.find('#filtro-asesor').empty().append('<option value="">Seleccione una oficina primero</option>').prop('disabled', true);
                        self.cargarTodosCLAs().then(resolve);
                        return;
                    }
                    self.filtros.oficina = p.oficinaUsuario;
                    var $cla = self.$el.find('#filtro-cla');
                    $cla.empty().append('<option value="' + (p.claUsuario || '') + '">' + (p.claNombre || (p.claUsuario ? 'CLA asignado' : 'Sin CLA asignado')) + '</option>').prop('disabled', true);
                    if (p.oficinaUsuario) {
                        self.$el.find('#filtro-oficina').empty().append('<option value="' + p.oficinaUsuario + '">' + (p.oficinaNombre || 'Oficina asignada') + '</option>').prop('disabled', true);
                        self.cargarAsesoresPorOficina(p.oficinaUsuario).then(resolve);
                    } else { resolve(); }
                    return;
                }
                if (p.esAsesor) {
                    self.filtros.asesor = p.usuarioId;
                    self.$el.find('#filtro-cla').empty().append('<option value="' + (p.claUsuario || '') + '">' + (p.claNombre || (p.claUsuario ? 'CLA asignado' : 'Sin CLA asignado')) + '</option>').prop('disabled', true);
                    self.$el.find('#filtro-oficina').empty().append('<option value="' + (p.oficinaUsuario || '') + '">' + (p.oficinaNombre || (p.oficinaUsuario ? 'Oficina asignada' : 'Sin oficina asignada')) + '</option>').prop('disabled', true);
                    self.$el.find('#filtro-asesor').empty().append('<option value="' + p.usuarioId + '">' + (p.userName || 'Usuario actual') + '</option>').prop('disabled', true);
                    resolve();
                } else { resolve(); }
            });
        },

        cargarTodosCLAs: function () {
            var self = this;
            return new Promise(function (resolve) {
                Espo.Ajax.getRequest('InvLista/action/getCLAs')
                    .then(function (r) { if (r.success) self.poblarSelectCLAs(r.data); resolve(); })
                    .catch(function () { resolve(); });
            });
        },

        poblarSelectCLAs: function (clas) {
            var $s = this.$el.find('#filtro-cla');
            $s.empty().append('<option value="">Todos los CLAs</option>');
            clas.forEach(function (c) { $s.append('<option value="' + c.id + '">' + c.name + '</option>'); });
        },

        onCLAChange: function (claId) {
            var self = this;
            return new Promise(function (resolve) {
                var $of = self.$el.find('#filtro-oficina'), $as = self.$el.find('#filtro-asesor');
                if (!claId) {
                    $of.html('<option value="">Seleccione un CLA primero</option>').prop('disabled', true);
                    $as.html('<option value="">Seleccione una oficina primero</option>').prop('disabled', true);
                    resolve(); return;
                }
                $of.html('<option value="">Cargando...</option>').prop('disabled', true);
                $as.html('<option value="">Seleccione una oficina primero</option>').prop('disabled', true);
                Espo.Ajax.getRequest('InvLista/action/getOficinasByCLA', { claId: claId })
                    .then(function (r) { if (r.success) self.poblarSelectOficinas(r.data); resolve(); })
                    .catch(function () { $of.html('<option value="">Error al cargar</option>'); resolve(); });
            });
        },

        poblarSelectOficinas: function (oficinas) {
            var $s = this.$el.find('#filtro-oficina');
            $s.empty().append('<option value="">Todas las oficinas</option>');
            oficinas.filter(function (o) { return o.id !== '1'; })
                    .forEach(function (o) { $s.append('<option value="' + o.id + '">' + o.name + '</option>'); });
            $s.prop('disabled', false);
        },

        onOficinaChange: function (oficinaId) {
            var self = this;
            return new Promise(function (resolve) {
                var $as = self.$el.find('#filtro-asesor');
                if (!oficinaId) { $as.html('<option value="">Seleccione una oficina primero</option>').prop('disabled', true); resolve(); return; }
                $as.html('<option value="">Cargando...</option>').prop('disabled', true);
                self.cargarAsesoresPorOficina(oficinaId).then(resolve);
            });
        },

        cargarAsesoresPorOficina: function (oficinaId) {
            var self = this;
            return new Promise(function (resolve) {
                Espo.Ajax.getRequest('InvLista/action/getAsesoresByOficina', { oficinaId: oficinaId })
                    .then(function (r) {
                        if (r.success) self.poblarSelectAsesores(r.data);
                        else self.$el.find('#filtro-asesor').html('<option value="">Error al cargar asesores</option>').prop('disabled', false);
                        resolve();
                    })
                    .catch(function () {
                        self.$el.find('#filtro-asesor').html('<option value="">Error al cargar asesores</option>').prop('disabled', false);
                        resolve();
                    });
            });
        },

        poblarSelectAsesores: function (asesores) {
            var $s = this.$el.find('#filtro-asesor');
            $s.empty().append('<option value="">Todos los asesores</option>');
            if (asesores && asesores.length) {
                asesores.forEach(function (a) { $s.append('<option value="' + a.id + '">' + a.name + '</option>'); });
            } else {
                $s.append('<option value="" disabled>Sin asesores en esta oficina</option>');
            }
            $s.prop('disabled', false);
        },

        cargarPropiedadesIniciales: function () {
            var params = { pagina: this.paginacion.pagina, userId: this.getUser().id };
            var p = this.permisos;

            if (this.filtros.cla)        params.claId      = this.filtros.cla;
            if (this.filtros.oficina)    params.oficinaId  = this.filtros.oficina;
            if (this.filtros.asesor)     params.asesorId   = this.filtros.asesor;
            if (this.filtros.fechaDesde) params.fechaDesde = this.filtros.fechaDesde;
            if (this.filtros.fechaHasta) params.fechaHasta = this.filtros.fechaHasta;
            if (this.filtros.estatus)    params.estatus    = this.filtros.estatus;

            if (!params.claId && !params.oficinaId && !params.asesorId && p) {
                if (p.esCasaNacional) {
                } else if ((p.esGerente || p.esDirector || p.esCoordinador) && p.oficinaUsuario && p.oficinaUsuario !== '1') {
                    params.oficinaId = p.oficinaUsuario;
                } else if (p.esAsesor) {
                    params.asesorId = p.usuarioId;
                }
            }
            this.fetchPropiedades(params);
        },

        aplicarFiltros: function () {
            this.filtros = {
                cla:        this.$el.find('#filtro-cla').val()          || null,
                oficina:    this.$el.find('#filtro-oficina').val()      || null,
                asesor:     this.$el.find('#filtro-asesor').val()       || null,
                fechaDesde: this.$el.find('#filtro-fecha-desde').val()  || null,
                fechaHasta: this.$el.find('#filtro-fecha-hasta').val()  || null,
                estatus:    this.$el.find('#filtro-estatus').val()      || null
            };
            var p = this.permisos;
            if (p) {
                if (p.esAsesor) {
                    this.filtros.asesor = p.usuarioId; this.filtros.cla = null; this.filtros.oficina = null;
                } else if ((p.esGerente || p.esDirector || p.esCoordinador) && !p.esCasaNacional) {
                    this.filtros.oficina = p.oficinaUsuario; this.filtros.cla = null;
                }
            }
            this.paginacion.pagina = 1;
            this.actualizarUrlConFiltros();
            this.fetchConFiltrosActuales();
        },

        limpiarFiltros: function () {
            this.$el.find('#filtro-cla').val('');
            this.$el.find('#filtro-oficina').val('').prop('disabled', true).html('<option value="">Seleccione un CLA primero</option>');
            this.$el.find('#filtro-asesor').val('').prop('disabled', true).html('<option value="">Seleccione una oficina primero</option>');
            this.$el.find('#filtro-fecha-desde, #filtro-fecha-hasta').val('');
            this.$el.find('#filtro-estatus').val('');
            this.filtros = { cla: null, oficina: null, asesor: null, fechaDesde: null, fechaHasta: null, estatus: null };
            this.paginacion.pagina = 1;
            this.actualizarUrlConFiltros();
            this.cargarPropiedadesIniciales();
        },

        fetchConFiltrosActuales: function (pagina) {
            var params = { pagina: pagina || this.paginacion.pagina, userId: this.getUser().id };
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
            var $cont = this.$el.find('#inventario-container');
            $cont.html(this.spinnerHTML());
            var self = this;
            Espo.Ajax.getRequest('InvLista/action/getPropiedades', params)
                .then(function (r) {
                    self.cargandoPagina = false;
                    if (r.success) {
                        self.propiedadesPagina = r.data || [];
                        self.paginacion = r.paginacion || self.paginacion;
                        self.cargarInventarioData(self.propiedadesPagina);
                    } else {
                        $cont.html('<div class="alert alert-danger">Error: ' + (r.error || 'desconocido') + '</div>');
                    }
                })
                .catch(function () {
                    self.cargandoPagina = false;
                    $cont.html('<div class="alert alert-danger">Error al cargar propiedades</div>');
                });
        },

        cargarInventarioData: function (propiedades) {
            var ids = propiedades.map(function (p) { return p.id; });
            if (!ids.length) { this.renderizarTabla(); return; }
            var self = this;
            Espo.Ajax.postRequest('InvLista/action/getInventarioData', { propiedadIds: ids })
                .then(function (r) { if (r.success) self.inventarioData = r.data; self.renderizarTabla(); })
                .catch(function () { self.renderizarTabla(); });
        },

        irAPagina: function (pagina) {
            if (pagina < 1 || pagina > this.paginacion.totalPaginas || this.cargandoPagina) return;
            this.paginacion.pagina = pagina;
            this.actualizarUrlConFiltros();
            this.fetchConFiltrosActuales(pagina);
        },

        spinnerHTML: function () {
            return '<div class="inv-spinner-wrap">' +
                   '<div class="spinner-large"></div>' +
                   '<h4 class="inv-spinner-title">Cargando inventario...</h4>' +
                   '<p class="inv-spinner-sub">Obteniendo datos del servidor</p></div>';
        },

        calcularDias: function (fechaAlta) {
            if (!fechaAlta) return '-';
            var hoy   = new Date(); hoy.setHours(0, 0, 0, 0);
            var fecha = new Date(fechaAlta); fecha.setHours(0, 0, 0, 0);
            var diff  = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
            return Math.max(0, diff) + ' días';
        },

        colorDias: function (diasTexto) {
            var m = diasTexto.match(/(\d+)/);
            if (!m) return '#95a5a6';
            var d = parseInt(m[0], 10);
            return d < 90 ? '#27ae60' : d <= 150 ? '#f39c12' : '#e74c3c';
        },

        colorEstatus: function (e) {
            return e === 'Verde' ? '#27ae60' : e === 'Amarillo' ? '#f39c12' : e === 'Rojo' ? '#e74c3c' : '#95a5a6';
        },

        colorDemanda: function (d) {
            return d === 'Alta demanda' ? '#27ae60' : d === 'Media demanda' ? '#f39c12' : d === 'Baja demanda' ? '#e74c3c' : '#95a5a6';
        },

        renderizarTabla: function () {
            var self = this, $cont = this.$el.find('#inventario-container'), pag = this.paginacion;
            var inicio = pag.total === 0 ? 0 : (pag.pagina - 1) * pag.porPagina + 1;
            var fin    = Math.min(pag.pagina * pag.porPagina, pag.total);
            this.$el.find('#total-propiedades-mostradas').text(pag.total === 0 ? '0' : inicio + '–' + fin + ' de ' + pag.total);

            if (!this.propiedadesPagina.length) {
                $cont.html('<div class="no-data-card"><div class="no-data-icon"><i class="fas fa-home"></i></div><h3 class="no-data-title">No hay propiedades</h3><p class="no-data-text">No se encontraron propiedades con los filtros actuales</p></div>');
                return;
            }

            var inicioPag = (pag.pagina - 1) * pag.porPagina;
            var html = '<div class="tabla-wrapper"><table class="tabla-propiedades"><thead><tr>';
            html += '<th class="col-num">N°</th>';
            html += '<th class="col-id">ID</th>';
            html += '<th class="col-dias">Días</th>';
            html += '<th style="min-width:180px;">Dirección</th>';
            html += '<th style="min-width:140px;">Asesor</th>';
            html += '<th style="width:110px;">Tipo de propiedad</th>';
            html += '<th style="width:100px;">Operación</th>';
            html += '<th style="width:80px;text-align:center;">Estatus</th>';
            html += '<th style="width:100px;text-align:center;">Demanda</th>';
            html += '<th style="min-width:140px;">Apoderado</th>';
            html += '<th style="width:60px;text-align:center;">Ver</th>';
            html += '</tr></thead><tbody>';

            this.propiedadesPagina.forEach(function (prop, idx) {
                var num      = inicioPag + idx + 1;
                var inv      = self.inventarioData[prop.id] || null;
                var estatus  = inv ? (inv.estatusPropiedad || 'Sin calcular') : 'Sin calcular';
                var demanda  = inv ? (inv.demanda || 'Sin definir') : 'Sin definir';
                var dias     = self.calcularDias(prop.fechaAlta);
                var partes   = [prop.calle, prop.numero, prop.urbanizacion].filter(Boolean);
                var dir      = partes.join(' ') || '-';
                if (dir.length > 0) {
                    dir = dir.charAt(0).toUpperCase() + dir.slice(1);
                }
                var asesor   = prop.asesorNombre || '-';
                var asesorSh = asesor.length > 22 ? asesor.substring(0, 20) + '…' : asesor;
                var apoCellId = 'apo-' + prop.id;
                
                var tipoOperacion = prop.tipoOperacion || '-';
                var mapaTipoOperacion = {
                    'compartida': 'Compartida',
                    'otrosIngresos': 'Otros ingresos',
                    'referido': 'Referido',
                    'renta': 'Alquiler',
                    'venta': 'Venta'
                };
                tipoOperacion = mapaTipoOperacion[tipoOperacion] || tipoOperacion;
                
                var tipoPropiedad = prop.tipoPropiedad || '-';
                if (tipoPropiedad.length > 0) {
                    tipoPropiedad = tipoPropiedad.charAt(0).toUpperCase() + tipoPropiedad.slice(1);
                }

                html += '<tr data-id="' + prop.id + '">';
                html += '<td class="col-num-cell">' + num + '</td>';
                html += '<td class="td-id">' + self.esc(prop.id) + '</td>';
                html += '<td class="td-dias" style="background:' + self.colorDias(dias) + ';">' + dias + '</td>';
                html += '<td title="' + self.esc(dir) + '" class="td-ellipsis">' + self.esc(dir) + '</td>';
                html += '<td title="' + self.esc(asesor) + '" class="td-ellipsis">' + self.esc(asesorSh) + '</td>';
                html += '<td class="td-ellipsis">' + self.esc(tipoPropiedad) + '</td>';
                html += '<td class="td-ellipsis">' + self.esc(tipoOperacion) + '</td>';
                html += '<td style="text-align:center;"><span class="badge-estado" style="background:' + self.colorEstatus(estatus) + ';">' + self.esc(estatus) + '</span></td>';
                html += '<td style="text-align:center;"><span class="badge-estado" style="background:' + self.colorDemanda(demanda) + ';">' + self.esc(demanda) + '</span></td>';

                if (inv && inv.apoderado) {
                    html += '<td id="' + apoCellId + '" class="td-apo"><span class="td-apo-loading">Cargando…</span></td>';
                } else {
                    html += '<td id="' + apoCellId + '" class="td-apo td-apo-empty">Sin apoderado</td>';
                }

                html += '<td style="text-align:center;"><button class="btn-ver" data-id="' + prop.id + '"><i class="fas fa-eye"></i></button></td>';
                html += '</tr>';
            });

            html += '</tbody></table></div>';
            html += this.renderPaginacion();
            $cont.html(html);

            this.propiedadesPagina.forEach(function (prop) {
                var inv = self.inventarioData[prop.id];
                if (inv && inv.apoderado && inv.id) {
                    self.cargarRecaudosApoderado(inv.id, $cont.find('#apo-' + prop.id));
                }
            });

            $cont.find('tr[data-id]').on('click', function (e) {
                if (!$(e.target).closest('button').length) self.verDetalle($(this).data('id'));
            });
            $cont.find('.btn-ver').on('click', function (e) {
                e.stopPropagation(); self.verDetalle($(this).data('id'));
            });
            $cont.find('.pag-btn').on('click', function () {
                var p = parseInt($(this).data('pagina'), 10);
                if (!isNaN(p)) self.irAPagina(p);
            });
        },

        renderPaginacion: function () {
            var pag = this.paginacion;
            if (pag.totalPaginas <= 1) return '';
            var actual = pag.pagina, total = pag.totalPaginas, pages = [];
            var rango = 2, inicio = Math.max(2, actual - rango), fin = Math.min(total - 1, actual + rango);
            pages.push(1);
            if (inicio > 2) pages.push('...');
            for (var i = inicio; i <= fin; i++) pages.push(i);
            if (fin < total - 1) pages.push('...');
            if (total > 1) pages.push(total);

            var html = '<div class="paginacion-container">';
            html += '<div class="paginacion-info">Página ' + actual + ' de ' + total + '</div>';
            html += '<div class="paginacion-controles">';
            html += '<button class="pag-btn pag-nav' + (actual <= 1 ? ' disabled' : '') + '" data-pagina="' + (actual - 1) + '"' + (actual <= 1 ? ' disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
            pages.forEach(function (p) {
                if (p === '...') {
                    html += '<span class="pag-ellipsis">…</span>';
                } else {
                    html += '<button class="pag-btn' + (p === actual ? ' pag-activo' : '') + '" data-pagina="' + p + '">' + p + '</button>';
                }
            });
            html += '<button class="pag-btn pag-nav' + (actual >= total ? ' disabled' : '') + '" data-pagina="' + (actual + 1) + '"' + (actual >= total ? ' disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
            html += '</div></div>';
            return html;
        },

        cargarRecaudosApoderado: function (inventarioId, $cell) {
            Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosApoderado', { inventarioId: inventarioId })
                .then(function (r) {
                    if (r.success && r.data && r.data.recaudos && r.data.recaudos.length) {
                        var tiene = r.data.recaudos.filter(function (rc) { return rc.estado === 'Adecuado'; });
                        $cell.html(tiene.length
                            ? tiene.map(function (rc) { return '<div class="apo-item">• ' + rc.name + '</div>'; }).join('')
                            : '<span class="td-apo-loading">Sin recaudos</span>'
                        );
                    } else {
                        $cell.html('<span class="td-apo-empty">Sin recaudos</span>');
                    }
                })
                .catch(function () { $cell.html('<span class="td-apo-error">Error</span>'); });
        },

        verDetalle: function (propiedadId) {
            var qp = [];
            if (this.filtros.cla)        qp.push('cla='        + encodeURIComponent(this.filtros.cla));
            if (this.filtros.oficina)    qp.push('oficina='    + encodeURIComponent(this.filtros.oficina));
            if (this.filtros.asesor)     qp.push('asesor='     + encodeURIComponent(this.filtros.asesor));
            if (this.filtros.fechaDesde) qp.push('fechaDesde=' + encodeURIComponent(this.filtros.fechaDesde));
            if (this.filtros.fechaHasta) qp.push('fechaHasta=' + encodeURIComponent(this.filtros.fechaHasta));
            if (this.filtros.estatus)    qp.push('estatus='    + encodeURIComponent(this.filtros.estatus));
            if (this.paginacion.pagina > 1) qp.push('pagina=' + this.paginacion.pagina);
            this.getRouter().navigate('#InvLista/propiedad/propiedadId=' + propiedadId + (qp.length ? '?' + qp.join('&') : ''), { trigger: true });
        },

        esc: function (text) {
            if (!text) return '';
            return String(text).replace(/[&<>"']/g, function (m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
            });
        }
    });
});