define('inventario:controllers/inv-sub-buyer', ['controllers/record'], function (Dep) {

    return Dep.extend({

        defaultAction: 'list',

        checkAccess: function () {
            return true;
        }

    });
});