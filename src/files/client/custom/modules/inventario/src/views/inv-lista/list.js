define('inventario:views/inv-lista/list', ['view'], function (Dep) {

    return Dep.extend({

        template: 'inventario:inv-lista/list',

        data: function () {
            return {
                userName: this.userName,
                userEmail: this.userEmail
            };
        },

        setup: function () {
            Dep.prototype.setup.call(this);

            // Obtener información del usuario logueado
            var user = this.getUser();
            this.userName = user.get('name');
            this.userEmail = user.get('emailAddress');

            console.log('=== InvLista Setup ===');
            console.log('Usuario:', this.userName);
            console.log('Email:', this.userEmail);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            console.log('Vista InvLista renderizada correctamente');
        },

        events: {
            'click [data-action="testButton"]': function (e) {
                e.preventDefault();
                this.actionTestButton();
            }
        },

        actionTestButton: function () {
            Espo.Ui.notify('¡Botón presionado por ' + this.userName + '!', 'success', 3000);
            console.log('Acción ejecutada por:', this.userName);
        }

    });
});
