define('inventario:views/modules/subbuyer', [], function () {
    
    var SubBuyerManager = function (view) {
        this.view = view;
        this.$select = null;
        this.subBuyerSeleccionado = null;
    };

    SubBuyerManager.prototype.setupEventListeners = function () {
        var self = this;
        
        // Cambio en buyer persona para cargar sub buyers
        this.view.$el.find('#buyerPersona').on('change', function (e) {
            var buyerSeleccionado = $(e.target).val();
            self.cargarSubBuyers(buyerSeleccionado);
        });
    };

    SubBuyerManager.prototype.inicializar = function () {
        this.$select = this.view.$el.find('#subBuyerPersona');
        
        // Verificar si ya hay un valor seleccionado
        var buyerInicial = this.view.$el.find('#buyerPersona').val();
        if (buyerInicial) {
            this.cargarSubBuyers(buyerInicial);
        }
    };

    SubBuyerManager.prototype.cargarSubBuyers = function (buyer) {
        var self = this;
        
        if (!buyer) {
            this.$select.html('<option value="">Seleccione un Buyer Persona primero</option>');
            return;
        }
        
        this.$select.html('<option value="">Cargando sub buyers...</option>');
        
        // Hacer petición AJAX para obtener sub buyers
        Espo.Ajax.getRequest('InvPropiedades/action/getSubBuyers', { buyer: buyer })
            .then(function (response) {
                if (response.success && response.data && response.data.length > 0) {
                    self.$select.empty();
                    self.$select.append('<option value="">Seleccione un sub buyer</option>');
                    
                    response.data.forEach(function (subBuyer) {
                        self.$select.append('<option value="' + subBuyer.id + '">' + subBuyer.name + '</option>');
                    });
                    
                    // Si ya había un sub buyer seleccionado, seleccionarlo
                    if (self.subBuyerSeleccionado) {
                        self.seleccionarSubBuyerPorValor(self.subBuyerSeleccionado);
                    }
                } else {
                    self.$select.html('<option value="">No hay sub buyers disponibles</option>');
                }
            }.bind(this))
            .catch(function (error) {
                console.error('Error cargando sub buyers:', error);
                self.$select.html('<option value="">Error al cargar sub buyers</option>');
            });
    };

    SubBuyerManager.prototype.setValorInicial = function (valor) {
        this.subBuyerSeleccionado = valor;
        
        // Si el select ya está cargado, seleccionar el valor
        if (this.$select && this.$select.find('option').length > 1) {
            this.seleccionarSubBuyerPorValor(valor);
        }
    };

    SubBuyerManager.prototype.seleccionarSubBuyerPorValor = function (valor) {
        if (!valor || !this.$select) return;
        
        // Buscar la opción por texto (name)
        var $option = this.$select.find('option').filter(function () {
            return $(this).text() === valor;
        });
        
        if ($option.length > 0) {
            this.$select.val($option.val());
        }
    };

    SubBuyerManager.prototype.getSubBuyerSeleccionado = function () {
        var textoSeleccionado = this.$select.find('option:selected').text();
        return textoSeleccionado !== 'Seleccione un sub buyer' && 
               textoSeleccionado !== 'Cargando sub buyers...' && 
               textoSeleccionado !== 'No hay sub buyers disponibles' && 
               textoSeleccionado !== 'Error al cargar sub buyers' ? 
               textoSeleccionado : '';
    };

    return SubBuyerManager;
});