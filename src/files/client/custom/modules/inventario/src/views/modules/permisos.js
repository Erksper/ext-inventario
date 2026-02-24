define('inventario:views/modules/permisos', [], function () {

    var PermisosManager = function (view) {
        this.view = view;
        this.permisos = {
            esAdministrativo: false,
            esCasaNacional:   false,
            esGerente:        false,
            esDirector:       false,
            esCoordinador:    false,
            esAsesor:         false,
            claUsuario:       null,
            claNombre:        null,  // Asegurar que existe
            oficinaUsuario:   null,
            oficinaNombre:    null,  // Asegurar que existe
            userName:         null,
            usuarioId:        null,
            permisosListo:    false
        };
    };

    PermisosManager.prototype.cargarPermisosUsuario = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            var user = self.view.getUser();

            Espo.Ajax.getRequest('InvLista/action/getUserInfo', { userId: user.id })
                .then(function (response) {
                    if (response.success && response.data) {
                        var info = response.data;

                        var esAdminType = info.userType === 'admin';
                        var tieneRolesGestion = info.esGerente || info.esCoordinador || info.esDirector || info.esCasaNacional;
                        var esAsesorPuro = info.userType === 'regular' && !tieneRolesGestion;

                        self.permisos = {
                            esAdministrativo: esAdminType,
                            esCasaNacional:   info.esCasaNacional  || false,
                            esGerente:        info.esGerente       || false,
                            esDirector:       info.esDirector      || false,
                            esCoordinador:    info.esCoordinador   || false,
                            esAsesor:         esAsesorPuro,
                            claUsuario:       info.claUsuario      || null,
                            claNombre:        info.claNombre       || null,  // NUEVO
                            oficinaUsuario:   info.oficinaUsuario  || null,
                            oficinaNombre:    info.oficinaNombre   || null,  // NUEVO
                            userName:         info.userName        || null,
                            usuarioId:        info.usuarioId       || user.id,
                            permisosListo:    true
                        };

                        console.log('PermisosManager - datos completos:', self.permisos); // Log para debug
                        resolve(self.permisos);
                    } else {
                        reject(response.error || 'Error al cargar permisos');
                    }
                })
                .catch(reject);
        });
    };

    PermisosManager.prototype.getPermisos = function () {
        return this.permisos;
    };

    PermisosManager.prototype.puedeVerTodasLasPropiedades = function () {
        return this.permisos.esAdministrativo || this.permisos.esCasaNacional;
    };

    PermisosManager.prototype.puedeVerPropiedadesOficina = function () {
        return this.permisos.esGerente || this.permisos.esDirector || this.permisos.esCoordinador;
    };

    PermisosManager.prototype.soloPuedeVerSusPropiedades = function () {
        return this.permisos.esAsesor;
    };

    return PermisosManager;
});