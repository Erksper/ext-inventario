define('inventario:views/list', [
    'view',
    'inventario:views/modules/permisos'
], function (Dep, PermisosManager) {
    
    return Dep.extend({
        
        template: 'inventario:list',

        setup: function () {
            Dep.prototype.setup.call(this);
            
            console.log('=== InvLista - Vista List cargada ===');
            
            this.permisosManager = new PermisosManager(this);
            
            this.filtros = {
                cla: null,
                oficina: null,
                asesor: null,
                fechaDesde: null,
                fechaHasta: null
            };
            
            this.propiedades = [];
            this.propiedadesFiltradas = [];
            this.inventarioData = {}; // Para almacenar datos de InvPropiedades
            
            this.cargarPermisos();
        },

        cargarPermisos: function () {
            this.permisosManager.cargarPermisosUsuario()
                .then(function (permisos) {
                    this.permisos = permisos;
                    console.log('Permisos cargados:', this.permisos);
                    this.cargarFiltros();
                    this.cargarPropiedadesIniciales();
                }.bind(this))
                .catch(function (error) {
                    console.error('Error cargando permisos:', error);
                    this.cargarPropiedades();
                }.bind(this));
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.setupEventListeners();
            
            // Ocultar los filtros que ya no se usan
            this.$el.find('#filtro-estado').parent().hide();
            this.$el.find('#filtro-municipio').parent().hide();
            this.$el.find('#filtro-ciudad').parent().hide();
        },

        setupEventListeners: function () {
            // Aplicar filtros
            this.$el.find('[data-action="aplicar-filtros"]').on('click', function () {
                this.aplicarFiltros();
            }.bind(this));

            // Limpiar filtros
            this.$el.find('[data-action="limpiar-filtros"]').on('click', function () {
                this.limpiarFiltros();
            }.bind(this));

            // Filtros en cascada
            this.$el.find('#filtro-cla').on('change', function (e) {
                this.onCLAChange($(e.currentTarget).val());
            }.bind(this));

            this.$el.find('#filtro-oficina').on('change', function (e) {
                this.onOficinaChange($(e.currentTarget).val());
            }.bind(this));
        },

        cargarFiltros: function () {
            var permisos = this.permisosManager.getPermisos();
            
            if (permisos.esCasaNacional || permisos.esAdministrativo) {
                this.cargarTodosCLAs();
            } else if (permisos.esGerente || permisos.esDirector || permisos.esCoordinador) {
                this.cargarFiltrosRestringidos(permisos);
            } else if (permisos.esAsesor) {
                this.cargarFiltrosAsesor(permisos);
            } else {
                this.cargarTodosCLAs();
            }
        },

        cargarTodosCLAs: function () {
            Espo.Ajax.getRequest('InvLista/action/getCLAs')
                .then(function (response) {
                    if (response.success) {
                        this.poblarSelectCLAs(response.data);
                    }
                }.bind(this))
                .catch(function (error) {
                    console.error('Error cargando CLAs:', error);
                });
        },

        cargarFiltrosRestringidos: function (permisos) {
            var selectCLA = this.$el.find('#filtro-cla');
            var selectOficina = this.$el.find('#filtro-oficina');
            var selectAsesor = this.$el.find('#filtro-asesor');
            
            if (permisos.claUsuario) {
                selectCLA.html('<option value="' + permisos.claUsuario + '" selected>' + permisos.claUsuario + '</option>');
                selectCLA.prop('disabled', true);
                this.filtros.cla = permisos.claUsuario;
            }
            
            if (permisos.oficinaUsuario) {
                selectOficina.html('<option value="' + permisos.oficinaUsuario + '" selected>Cargando...</option>');
                selectOficina.prop('disabled', true);
                
                Espo.Ajax.getRequest('InvLista/action/getInfoOficina', { 
                    oficinaId: permisos.oficinaUsuario 
                })
                    .then(function (response) {
                        if (response.success) {
                            selectOficina.html('<option value="' + permisos.oficinaUsuario + '" selected>' + response.data.nombreOficina + '</option>');
                        }
                    }.bind(this));
                
                this.filtros.oficina = permisos.oficinaUsuario;
                this.onOficinaChange(permisos.oficinaUsuario);
            }
        },

        cargarFiltrosAsesor: function (permisos) {
            var selectCLA = this.$el.find('#filtro-cla');
            var selectOficina = this.$el.find('#filtro-oficina');
            var selectAsesor = this.$el.find('#filtro-asesor');
            
            selectCLA.html('<option value="">Todas mis propiedades</option>').prop('disabled', true);
            selectOficina.html('<option value="">Mi oficina</option>').prop('disabled', true);
            selectAsesor.html('<option value="' + permisos.usuarioId + '" selected>Mis propiedades</option>').prop('disabled', true);
            
            this.filtros.asesor = permisos.usuarioId;
        },

        poblarSelectCLAs: function (clas) {
            var select = this.$el.find('#filtro-cla');
            select.empty();
            select.append('<option value="">Todos los CLAs</option>');
            
            clas.forEach(function (cla) {
                select.append('<option value="' + cla.id + '">' + cla.name + '</option>');
            });
        },

        onCLAChange: function (claId) {
            var selectOficina = this.$el.find('#filtro-oficina');
            var selectAsesor = this.$el.find('#filtro-asesor');
            
            selectOficina.html('<option value="">Cargando...</option>').prop('disabled', true);
            selectAsesor.html('<option value="">Seleccione una oficina primero</option>').prop('disabled', true);
            
            if (!claId) {
                selectOficina.html('<option value="">Seleccione un CLA primero</option>');
                return;
            }
            
            Espo.Ajax.getRequest('InvLista/action/getOficinasByCLA', { claId: claId })
                .then(function (response) {
                    if (response.success) {
                        this.poblarSelectOficinas(response.data);
                    }
                }.bind(this))
                .catch(function (error) {
                    console.error('Error cargando oficinas:', error);
                });
        },

        poblarSelectOficinas: function (oficinas) {
            var select = this.$el.find('#filtro-oficina');
            select.empty();
            select.append('<option value="">Todas las oficinas</option>');
            
            oficinas.forEach(function (oficina) {
                select.append('<option value="' + oficina.id + '">' + oficina.name + '</option>');
            });
            
            select.prop('disabled', false);
        },

        onOficinaChange: function (oficinaId) {
            var selectAsesor = this.$el.find('#filtro-asesor');
            
            selectAsesor.html('<option value="">Cargando...</option>').prop('disabled', true);
            
            if (!oficinaId) {
                selectAsesor.html('<option value="">Seleccione una oficina primero</option>');
                return;
            }
            
            Espo.Ajax.getRequest('InvLista/action/getAsesoresByOficina', { oficinaId: oficinaId })
                .then(function (response) {
                    if (response.success) {
                        this.poblarSelectAsesores(response.data);
                    }
                }.bind(this))
                .catch(function (error) {
                    console.error('Error cargando asesores:', error);
                });
        },

        poblarSelectAsesores: function (asesores) {
            var select = this.$el.find('#filtro-asesor');
            select.empty();
            select.append('<option value="">Todos los asesores</option>');
            
            asesores.forEach(function (asesor) {
                select.append('<option value="' + asesor.id + '">' + asesor.name + '</option>');
            });
            
            select.prop('disabled', false);
        },

        cargarPropiedades: function () {
            var container = this.$el.find('#inventario-container');
            
            Espo.Ajax.getRequest('InvLista/action/getPropiedades')
                .then(function (response) {
                    if (response.success) {
                        this.propiedades = response.data;
                        // Filtrar solo propiedades con status "En promocion"
                        this.propiedades = this.propiedades.filter(function(prop) {
                            return prop.status === "En promocion";
                        });
                        this.propiedadesFiltradas = this.propiedades;
                        
                        // Cargar datos de InvPropiedades
                        this.cargarInventarioData();
                    }
                }.bind(this))
                .catch(function (error) {
                    console.error('Error cargando propiedades:', error);
                    container.html('<div class="alert alert-danger">Error al cargar propiedades</div>');
                });
        },

        cargarPropiedadesIniciales: function () {
            if (!this.permisos) {
                this.cargarPropiedades();
                return;
            }
            
            var params = {};
            
            if (this.permisos.esAsesor) {
                params.asesorId = this.permisos.usuarioId;
            } else if (this.permisos.esGerente || this.permisos.esDirector || this.permisos.esCoordinador) {
                if (this.permisos.oficinaUsuario) {
                    params.oficinaId = this.permisos.oficinaUsuario;
                }
            }
            
            var container = this.$el.find('#inventario-container');
            
            Espo.Ajax.getRequest('InvLista/action/getPropiedades', params)
                .then(function (response) {
                    if (response.success) {
                        this.propiedades = response.data;
                        // Filtrar solo propiedades con status "En promocion"
                        this.propiedades = this.propiedades.filter(function(prop) {
                            return prop.status === "En promocion";
                        });
                        this.propiedadesFiltradas = this.propiedades;
                        
                        // Cargar datos de InvPropiedades
                        this.cargarInventarioData();
                    }
                }.bind(this))
                .catch(function (error) {
                    console.error('Error cargando propiedades:', error);
                    container.html('<div class="alert alert-danger">Error al cargar propiedades</div>');
                });
        },

        cargarInventarioData: function() {
            var propiedadIds = this.propiedades.map(function(prop) {
                return prop.id;
            });
            
            if (propiedadIds.length === 0) {
                this.renderizarTabla();
                return;
            }
            
            Espo.Ajax.postRequest('InvLista/action/getInventarioData', {
                propiedadIds: propiedadIds
            })
                .then(function(response) {
                    if (response.success) {
                        this.inventarioData = response.data;
                        this.renderizarTabla();
                    }
                }.bind(this))
                .catch(function(error) {
                    console.error('Error cargando datos de inventario:', error);
                    this.renderizarTabla();
                }.bind(this));
        },

        cargarPropiedadesFiltradas: function () {
            var container = this.$el.find('#inventario-container');
            
            var params = {};
            if (this.filtros.cla) params.claId = this.filtros.cla;
            if (this.filtros.oficina) params.oficinaId = this.filtros.oficina;
            if (this.filtros.asesor) params.asesorId = this.filtros.asesor;
            if (this.filtros.fechaDesde) params.fechaDesde = this.filtros.fechaDesde;
            if (this.filtros.fechaHasta) params.fechaHasta = this.filtros.fechaHasta;
            
            Espo.Ajax.getRequest('InvLista/action/getPropiedades', params)
                .then(function (response) {
                    if (response.success) {
                        this.propiedadesFiltradas = response.data;
                        // Filtrar solo propiedades con status "En promocion"
                        this.propiedadesFiltradas = this.propiedadesFiltradas.filter(function(prop) {
                            return prop.status === "En promocion";
                        });
                        
                        // Cargar datos de InvPropiedades
                        this.cargarInventarioDataFiltradas();
                        Espo.Ui.success('Filtros aplicados: ' + this.propiedadesFiltradas.length + ' resultados');
                    }
                }.bind(this))
                .catch(function (error) {
                    console.error('Error aplicando filtros:', error);
                    Espo.Ui.error('Error al aplicar filtros');
                });
        },

        cargarInventarioDataFiltradas: function() {
            var propiedadIds = this.propiedadesFiltradas.map(function(prop) {
                return prop.id;
            });
            
            if (propiedadIds.length === 0) {
                this.renderizarTabla();
                return;
            }
            
            Espo.Ajax.postRequest('InvLista/action/getInventarioData', {
                propiedadIds: propiedadIds
            })
                .then(function(response) {
                    if (response.success) {
                        this.inventarioData = response.data;
                        this.renderizarTabla();
                    }
                }.bind(this))
                .catch(function(error) {
                    console.error('Error cargando datos de inventario:', error);
                    this.renderizarTabla();
                }.bind(this));
        },

        aplicarFiltros: function () {
            this.filtros = {
                cla: this.$el.find('#filtro-cla').val(),
                oficina: this.$el.find('#filtro-oficina').val(),
                asesor: this.$el.find('#filtro-asesor').val(),
                fechaDesde: this.$el.find('#filtro-fecha-desde').val(),
                fechaHasta: this.$el.find('#filtro-fecha-hasta').val()
            };
            
            this.cargarPropiedadesFiltradas();
        },

        limpiarFiltros: function () {
            this.$el.find('#filtro-cla').val('');
            this.$el.find('#filtro-oficina').val('').prop('disabled', true).html('<option value="">Seleccione un CLA primero</option>');
            this.$el.find('#filtro-asesor').val('').prop('disabled', true).html('<option value="">Seleccione una oficina primero</option>');
            this.$el.find('#filtro-fecha-desde').val('');
            this.$el.find('#filtro-fecha-hasta').val('');
            
            this.filtros = {
                cla: null,
                oficina: null,
                asesor: null,
                fechaDesde: null,
                fechaHasta: null
            };
            
            this.cargarPropiedadesIniciales();
            Espo.Ui.info('Filtros limpiados');
        },

        calcularDiasEnMercado: function(fechaAlta) {
            if (!fechaAlta) return '-';
            
            var fechaAltaDate = new Date(fechaAlta);
            var hoy = new Date();
            
            // Calcular diferencia en días
            var diferenciaMs = hoy - fechaAltaDate;
            var dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
            
            return dias + ' días';
        },

        obtenerColorEstatus: function(estatus) {
            if (!estatus) return '#95a5a6'; // Gris
            if (estatus === 'Verde') return '#27ae60';
            if (estatus === 'Amarillo') return '#f39c12';
            if (estatus === 'Rojo') return '#e74c3c';
            return '#95a5a6';
        },

        obtenerColorDemanda: function(demanda) {
            if (!demanda) return '#95a5a6';
            if (demanda === 'Alta demanda') return '#27ae60';
            if (demanda === 'Media demanda') return '#f39c12';
            if (demanda === 'Baja demanda') return '#e74c3c';
            return '#95a5a6';
        },

        // NUEVA FUNCIÓN: Cargar recaudos de apoderado
        cargarRecaudosApoderado: function(inventarioId, $cell) {
            Espo.Ajax.getRequest('InvPropiedades/action/getRecaudosApoderado', {
                inventarioId: inventarioId
            })
                .then(function(response) {
                    if (response.success && response.data && response.data.recaudos) {
                        var recaudos = response.data.recaudos;
                        
                        // FILTRAR: Solo los que TIENE (Adecuado)
                        var recaudosTiene = recaudos.filter(function(recaudo) {
                            return recaudo.estado === 'Adecuado';
                        });
                        
                        if (recaudosTiene.length === 0) {
                            $cell.html('<span style="color: #999; font-size: 12px;">Sin recaudos</span>');
                            return;
                        }
                        
                        var items = [];
                        recaudosTiene.forEach(function(recaudo) {
                            // TEXTO NEGRO, sin "Tiene"
                            items.push('<div style="color: #000; font-size: 11px; line-height: 1.4; margin-bottom: 2px;">• ' + recaudo.name + '</div>');
                        });
                        
                        $cell.html(items.join(''));
                    } else {
                        $cell.html('<span style="color: #999; font-size: 12px;">Sin recaudos</span>');
                    }
                })
                .catch(function(error) {
                    console.error('Error cargando recaudos apoderado:', error);
                    $cell.html('<span style="color: #e74c3c; font-size: 12px;">Error</span>');
                });
        },

        renderizarTabla: function () {
            var container = this.$el.find('#inventario-container');
            
            // Actualizar contador
            this.$el.find('#total-propiedades-mostradas').text(this.propiedadesFiltradas.length);
            
            if (this.propiedadesFiltradas.length === 0) {
                container.html('<div class="no-data-card"><div class="no-data-icon"><i class="fas fa-home"></i></div><h3 class="no-data-title">No hay propiedades</h3><p class="no-data-text">No se encontraron propiedades con status "En promoción"</p></div>');
                return;
            }
            
            // NUEVA ESTRUCTURA DE COLUMNAS
            var html = '<div class="tabla-propiedades"><table><thead><tr>';
            html += '<th style="width: 100px;">Días en el mercado</th>';
            html += '<th style="width: 300px;">Dirección</th>';  // AUMENTADO de 250px a 300px
            html += '<th style="width: 150px;">Asesor</th>';
            html += '<th style="width: 100px;">Tipo</th>';
            html += '<th style="width: 100px;">Operación</th>';
            html += '<th style="width: 90px;">Estatus</th>';
            html += '<th style="width: 90px;">Demanda</th>';
            html += '<th style="width: 250px;">Apoderado</th>';
            html += '<th style="width: 80px;">Acciones</th>';  // REDUCIDO de 100px a 80px
            html += '</tr></thead><tbody>';
            
            this.propiedadesFiltradas.forEach(function (propiedad) {
                var diasEnMercado = this.calcularDiasEnMercado(propiedad.fechaAlta);
                
                // DIRECCIÓN COMPLETA - SIN CORTAR
                var direccion = '';
                if (propiedad.calle) direccion += propiedad.calle;
                if (propiedad.numero) direccion += ' ' + propiedad.numero;
                if (propiedad.urbanizacion) direccion += ', ' + propiedad.urbanizacion;
                if (!direccion) direccion = '-';
                
                // NO CORTAR - mostrar completo con title para tooltip
                var direccionMostrar = direccion;
                
                var asesorName = propiedad.asesorNombre || '-';
                if (asesorName.length > 25) {
                    asesorName = asesorName.substring(0, 22) + '...';
                }
                
                // Obtener datos de InvPropiedades
                var inventario = this.inventarioData[propiedad.id] || null;
                
                // Estatus de la propiedad
                var estatus = inventario ? inventario.estatusPropiedad : 'Sin calcular';
                var colorEstatus = this.obtenerColorEstatus(estatus);
                
                // Demanda
                var demanda = inventario ? inventario.demanda : 'Sin definir';
                var colorDemanda = this.obtenerColorDemanda(demanda);
                
                html += '<tr data-id="' + propiedad.id + '" style="cursor: pointer;">';
                html += '<td style="font-size: 13px; font-weight: 600; text-align: center;">' + diasEnMercado + '</td>';
                
                // DIRECCIÓN COMPLETA
                html += '<td title="' + direccion + '" style="font-size: 13px; word-wrap: break-word; white-space: normal;">' + direccionMostrar + '</td>';
                
                html += '<td title="' + (propiedad.asesorNombre || '-') + '" style="font-size: 13px;">' + asesorName + '</td>';
                html += '<td style="font-size: 13px;">' + (propiedad.tipoPropiedad || '-') + '</td>';
                html += '<td style="font-size: 13px;">' + (propiedad.tipoOperacion || '-') + '</td>';
                
                // Estatus
                html += '<td style="text-align: center;"><span class="badge" style="background: ' + colorEstatus + '; color: white; font-size: 11px; padding: 5px 10px; border-radius: 4px;">' + estatus + '</span></td>';
                
                // Demanda
                html += '<td style="text-align: center;"><span class="badge" style="background: ' + colorDemanda + '; color: white; font-size: 11px; padding: 5px 10px; border-radius: 4px;">' + demanda + '</span></td>';
                
                // Apoderado - se carga dinámicamente
                var apoderadoCellId = 'apoderado-' + propiedad.id;
                if (inventario && inventario.apoderado) {
                    html += '<td id="' + apoderadoCellId + '" style="font-size: 12px; padding: 10px;"><span style="color: #999;">Cargando...</span></td>';
                } else {
                    html += '<td id="' + apoderadoCellId + '" style="font-size: 12px; padding: 10px;"><span style="color: #999;">Sin apoderado</span></td>';
                }
                
                // Acciones - BOTÓN MÁS COMPACTO
                html += '<td style="text-align: center;"><button class="btn btn-sm btn-view" data-id="' + propiedad.id + '" style="background: #B8A279; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;"><i class="fas fa-eye"></i></button></td>';
                html += '</tr>';
            }.bind(this));
            
            html += '</tbody></table></div>';
            
            container.html(html);
            
            // Cargar recaudos de apoderado dinámicamente
            this.propiedadesFiltradas.forEach(function(propiedad) {
                var inventario = this.inventarioData[propiedad.id] || null;
                if (inventario && inventario.apoderado && inventario.id) {
                    var $cell = container.find('#apoderado-' + propiedad.id);
                    this.cargarRecaudosApoderado(inventario.id, $cell);
                }
            }.bind(this));
            
            // Event listeners
            container.find('tr[data-id]').on('click', function (e) {
                if (!$(e.target).closest('button').length) {
                    var id = $(e.currentTarget).data('id');
                    this.verDetalle(id);
                }
            }.bind(this));
            
            container.find('.btn-view').on('click', function (e) {
                e.stopPropagation();
                var id = $(e.currentTarget).data('id');
                this.verDetalle(id);
            }.bind(this));
        },

        verDetalle: function (propiedadId) {
            console.log('Navegando a detalle de propiedad ID:', propiedadId);
            this.getRouter().navigate('#InvLista/propiedad/propiedadId=' + propiedadId, { trigger: true });
        }
    });
});