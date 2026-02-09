define('inventario:controllers/inv-lista', ['controllers/base'], function (Dep) {

    return Dep.extend({
        
        defaultAction: 'list',

        checkAccess: function () {
            return true;
        },

        actionList: function () {
            console.log('=== inv-lista.js - actionList ===');
            this.main('inventario:views/list', {}, function (view) {
                view.render();
            });
        },

        actionPropiedad: function (params) {
            console.log('=== inv-lista.js - actionPropiedad ===');
            console.log('Params:', params);
            
            var propiedadId = params.propiedadId;
            
            if (!propiedadId) {
                console.error('❌ No se proporcionó propiedadId');
                Espo.Ui.error('ID de propiedad no proporcionado');
                this.getRouter().navigate('#InvLista', { trigger: true });
                return;
            }
            
            console.log('✅ Cargando propiedad ID:', propiedadId);
            
            this.main('inventario:views/propiedad', {
                propiedadId: propiedadId
            }, function (view) {
                console.log('Vista propiedad renderizada');
                view.render();
            });
        }

    });
});