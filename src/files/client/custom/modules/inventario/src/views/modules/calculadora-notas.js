define('inventario:views/modules/calculadora-notas', [], function () {
    
    var CalculadoraNotas = function (view) {
        this.view = view;
    };

    CalculadoraNotas.prototype.calcularNotas = function () {
        var paneles = {
            'legal': 0,
            'mercadeo': 0
        };
        
        var tipoPersona = this.view.$el.find('#tipoPersona').val();
        var valorLegal = '';
        
        if (tipoPersona === 'Natural') {
            valorLegal = this.view.$el.find('#estadoLegalNatural').val();
        } else {
            valorLegal = this.view.$el.find('#estadoLegalJuridico').val();
        }
        
        paneles.legal = this.calcularPorcentajeLegal(valorLegal);
        
        var camposMercadeo = ['fotos', 'copy', 'video', 'videoInsertado', 'metricas', 'rotulo'];
        paneles.mercadeo = this.calcularPorcentajeMercadeo(camposMercadeo);
        
        this.actualizarPorcentajesUI(paneles);
        
        return paneles;
    };

    CalculadoraNotas.prototype.calcularPorcentajeLegal = function (valorLegal) {
        if (valorLegal === 'Adecuado') return 100;
        if (valorLegal === 'Revisar') return 50;
        return 0;
    };

    CalculadoraNotas.prototype.calcularPorcentajeMercadeo = function (campos) {
        var totalCampos = campos.length;
        var completos = 0;
        
        campos.forEach(function (campo) {
            var valor = this.view.$el.find('#' + campo).val();
            if (valor === 'Adecuado') {
                completos++;
            }
        }.bind(this));
        
        return totalCampos > 0 ? Math.round((completos / totalCampos) * 100) : 0;
    };

    CalculadoraNotas.prototype.actualizarPorcentajesUI = function (paneles) {
        this.view.$el.find('#nota-legal').text(paneles.legal + '%');
        this.view.$el.find('#nota-mercadeo').text(paneles.mercadeo + '%');
    };

    CalculadoraNotas.prototype.getNotaMercadeo = function () {
        var camposMercadeo = ['fotos', 'copy', 'video', 'videoInsertado', 'metricas', 'rotulo'];
        var valores = [];
        
        camposMercadeo.forEach(function (campo) {
            var valor = this.view.$el.find('#' + campo).val();
            valores.push(valor || 'Modificar');
        }.bind(this));
        
        if (valores.includes('Modificar')) return 'Modificar';
        if (valores.includes('Revisar')) return 'Revisar';
        return 'Adecuado';
    };

    CalculadoraNotas.prototype.inicializarPorcentajes = function () {
        this.calcularNotas();
    };

    return CalculadoraNotas;
});