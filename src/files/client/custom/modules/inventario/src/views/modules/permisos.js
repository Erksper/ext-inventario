define('inventario:views/modules/permisos', [], function () {
    
    var PermisosManager = function (view) {
        this.view = view;
        this.permisos = {
            esAdministrativo: false,
            esCasaNacional: false,
            esGerente: false,
            esDirector: false,
            esCoordinador: false,
            esAsesor: false,
            claUsuario: null,
            oficinaUsuario: null,
            usuarioId: null,
            permisosListo: false
        };
    };

    PermisosManager.prototype.cargarPermisosUsuario = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            var user = self.view.getUser();

            Espo.Ajax.getRequest('InvLista/action/getUserInfo', {
                userId: user.id
            })
                .then(function (response) {
                    if (response.success && response.data) {
                        var userInfo = response.data;

                        var esAdminType = userInfo.userType === 'admin';

                        var tieneRolesGestion =
                            userInfo.esGerente ||
                            userInfo.esCoordinador ||
                            userInfo.esDirector ||
                            userInfo.esCasaNacional;

                        var esAsesorRegular =
                            userInfo.userType === 'regular' &&
                            !tieneRolesGestion;

                        self.permisos = {
                            esAdministrativo: esAdminType,
                            esCasaNacional: userInfo.esCasaNacional || false,
                            esGerente: userInfo.esGerente || false,
                            esDirector: userInfo.esDirector || false,
                            esCoordinador: userInfo.esCoordinador || false,
                            esAsesor: esAsesorRegular,
                            claUsuario: userInfo.claUsuario || null,
                            oficinaUsuario: userInfo.oficinaUsuario || null,
                            usuarioId: userInfo.usuarioId || user.id,
                            permisosListo: true
                        };

                        self.aplicarRestriccionesUI();
                        resolve(self.permisos);
                    } else {
                        reject(response.error || 'Error al cargar permisos del usuario');
                    }
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    };

    PermisosManager.prototype.aplicarRestriccionesUI = function () {
        if (!this.view.$el) return;

        // Ocultar filtros según permisos
        if (this.permisos.esAsesor) {
            // Asesor: ocultar CLA y Oficina
            this.view.$el.find('#filtro-cla-group').hide();
            this.view.$el.find('#filtro-oficina-group').hide();
            this.view.$el.find('#filtro-asesor-group').hide();
        } else if (
            this.permisos.esGerente ||
            this.permisos.esDirector ||
            this.permisos.esCoordinador
        ) {
            // Roles de gestión: mostrar solo su oficina
            this.view.$el.find('#filtro-cla-group').show();
            this.view.$el.find('#filtro-oficina-group').show();
            this.view.$el.find('#filtro-asesor-group').show();
        } else if (
            this.permisos.esAdministrativo ||
            this.permisos.esCasaNacional
        ) {
            // Admin y Casa Nacional: ver todo
            this.view.$el.find('#filtro-cla-group').show();
            this.view.$el.find('#filtro-oficina-group').show();
            this.view.$el.find('#filtro-asesor-group').show();
        }
    };

    PermisosManager.prototype.getPermisos = function () {
        return this.permisos;
    };

    PermisosManager.prototype.puedeVerTodasLasPropiedades = function () {
        return this.permisos.esAdministrativo || this.permisos.esCasaNacional;
    };

    PermisosManager.prototype.puedeVerPropiedadesOficina = function () {
        return (
            this.permisos.esGerente ||
            this.permisos.esDirector ||
            this.permisos.esCoordinador
        );
    };

    PermisosManager.prototype.soloPuedeVerSusPropiedades = function () {
        return this.permisos.esAsesor;
    };

    return PermisosManager;
});
