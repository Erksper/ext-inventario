define('inventario:views/modules/semaforo', [], function () {
    
    var SemaforoManager = function (view) {
        this.view = view;
        this.camposSemaforo = {
            'mercadeo': ['fotos', 'copy', 'video', 'videoInsertado', 'metricas', 'rotulo'],
            'otros': ['exclusividad', 'precio', 'ubicacion', 'demanda']
        };
    };

    SemaforoManager.prototype.setupEventListeners = function () {
        var self = this;
        
        this.view.$el.off('click', '[data-action="selectSemaforo"]').on('click', '[data-action="selectSemaforo"]', function (e) {
            self.seleccionarSemaforo(e);
        });
    };

    SemaforoManager.prototype.seleccionarSemaforo = function (e) {
        var $target = $(e.currentTarget);
        var campo = $target.data('campo');
        var valor = $target.data('valor');
        
        this.view.$el.find('[data-campo="' + campo + '"]').removeClass('selected');
        $target.addClass('selected');
        this.view.$el.find('#' + campo).val(valor);
        
        if (this.camposSemaforo.mercadeo.includes(campo)) {
            this.view.calculadoraNotas.calcularNotas();
        }
    };

    SemaforoManager.prototype.inicializarCampo = function (campo, valor) {
        this.view.$el.find('#' + campo).val(valor || this.getValorPorDefecto(campo));
        this.view.$el.find('[data-campo="' + campo + '"]').removeClass('selected');
        
        var selector = '[data-campo="' + campo + '"][data-valor="' + (valor || this.getValorPorDefecto(campo)) + '"]';
        this.view.$el.find(selector).addClass('selected');
    };

    SemaforoManager.prototype.inicializarTodosLosCampos = function (inventarioData) {
        this.camposSemaforo.mercadeo.forEach(function (campo) {
            this.inicializarCampo(campo, inventarioData[campo]);
        }.bind(this));
        
        this.camposSemaforo.otros.forEach(function (campo) {
            this.inicializarCampo(campo, inventarioData[campo]);
        }.bind(this));
    };

    SemaforoManager.prototype.getValorPorDefecto = function (campo) {
        var valoresPorDefecto = {
            'fotos': 'Modificar',
            'copy': 'Modificar',
            'video': 'Modificar',
            'videoInsertado': 'Modificar',
            'metricas': 'Modificar',
            'rotulo': 'Modificar',
            'precio': 'En rango',
            'ubicacion': 'Modificar',
            'exclusividad': 'No exclusividad',
            'demanda': 'Media demanda'
        };
        
        return valoresPorDefecto[campo] || 'Modificar';
    };

    SemaforoManager.prototype.getValoresCampos = function () {
        var valores = {};
        var todosLosCampos = this.camposSemaforo.mercadeo.concat(this.camposSemaforo.otros);
        
        todosLosCampos.forEach(function (campo) {
            valores[campo] = this.view.$el.find('#' + campo).val() || this.getValorPorDefecto(campo);
        }.bind(this));
        
        return valores;
    };

    return SemaforoManager;
});