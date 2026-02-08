define('inventario:controllers/inv-lista', ['controllers/base'], function (Dep) {

    return Dep.extend({

        defaultAction: 'list',

        list: function (options) {
            this.actionList(options);
        },

        actionList: function (options) {
            this.main('inventario:views/list', null, function (view) {
                view.render();
            });
        },

        actionPropiedad: function (options) {
            var propiedadId = options.propiedadId;
            if (!propiedadId) {
                console.error('No se proporcionó propiedadId');
                this.redirect('#');
                return;
            }
            
            this.main('inventario:views/inventario/propiedad', {
                propiedadId: propiedadId
            }, function (view) {
                view.render();
            });
        },

    });
});
