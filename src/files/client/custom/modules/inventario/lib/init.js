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
    
    // Cargar estilos CSS para el módulo
    var cargarCSS = function() {
        // Verificar si ya se cargó el CSS
        if (document.getElementById('inventario-css')) {
            return;
        }
        
        var link = document.createElement('link');
        link.id = 'inventario-css';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'client/custom/modules/inventario/res/styles/inv-propiedades.css';
        document.head.appendChild(link);
        
        console.log('CSS del módulo Inventario cargado');
    };
    
    // Cargar CSS inmediatamente
    cargarCSS();
    
    // También cargar cuando se cargue la vista de propiedad
    Espo.loader.require([
        'inventario:views/inventario/propiedad',
        'inventario:views/list'
    ], function () {
        console.log('Vistas del módulo Inventario cargadas');
        // Asegurar que el CSS está cargado
        cargarCSS();
    });
    
    return {
        cargarCSS: cargarCSS
    };
});