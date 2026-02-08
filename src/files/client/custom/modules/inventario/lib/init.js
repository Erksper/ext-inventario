define('inventario:lib/init', [], function () {
    
    console.log('=== Inventario Module Initialized ===');
    
    // Registrar los controladores
    Espo.define('inventario:controllers/inventario', {
        init: function (application) {
            var Controller = require('inventario:controllers/inventario');
            return Controller;
        }
    }, true);
    
    Espo.define('inventario:controllers/inv-lista', {
        init: function (application) {
            var Controller = require('inventario:controllers/inv-lista');
            return Controller;
        }
    }, true);
    
    // Cargar estilos CSS
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'client/custom/modules/inventario/res/styles/inv-propiedades.css';
    document.head.appendChild(link);
    
    // Asegurar que las vistas estén disponibles
    Espo.loader.require([
        'inventario:views/inventario/propiedad',
        'inventario:views/list'
    ], function () {
        console.log('Vistas del módulo Inventario cargadas');
    });
});