define('inventario:controllers/inv-lista', ['controllers/base'], function (Dep) {

    return Dep.extend({
        
        defaultAction: 'list',

        checkAccess: function () {
            return true;
        },

        actionList: function () {
            this.main('inventario:views/list', {}, function (view) {
                view.render();
            });
        },

        actionPropiedad: function (params) {
            var propiedadId = params.propiedadId;
            
            if (!propiedadId) {
                Espo.Ui.error('ID de propiedad no proporcionado');
                this.getRouter().navigate('#InvLista', { trigger: true });
                return;
            }
            
            this.main('inventario:views/propiedad', {
                propiedadId: propiedadId
            }, function (view) {
                view.render();
            });
        }

    });
});