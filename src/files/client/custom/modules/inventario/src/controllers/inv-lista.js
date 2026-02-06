define('inventario:controllers/inv-lista', ['controllers/base'], function (Dep) {

    return Dep.extend({

        defaultAction: 'list',

        list: function (options) {
            this.actionList(options);
        },

        actionList: function (options) {
            this.main('inventario:views/inv-lista/list', null, function (view) {
                view.render();
            });
        }

    });
});
