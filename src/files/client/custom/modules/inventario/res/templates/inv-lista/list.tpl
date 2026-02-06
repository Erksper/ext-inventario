<div class="inv-lista-page">
    <div class="page-header">
        <h3>Inventario - Lista Principal</h3>
    </div>
    
    <div class="panel panel-default">
        <div class="panel-body">
            <div class="user-info-section">
                <h4>Información del Usuario</h4>
                <div class="info-item">
                    <strong>Nombre:</strong> 
                    <span class="text-success">{{userName}}</span>
                </div>
                <div class="info-item">
                    <strong>Email:</strong> 
                    <span class="text-muted">{{userEmail}}</span>
                </div>
            </div>
            
            <hr>
            
            <div class="actions-section">
                <button class="btn btn-primary" data-action="testButton">
                    <span class="fas fa-check"></span>
                    Probar Botón
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .inv-lista-page {
        padding: 20px;
    }
    
    .page-header h3 {
        margin-top: 0;
        color: #4CAF50;
    }
    
    .user-info-section {
        margin-bottom: 20px;
    }
    
    .user-info-section h4 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #555;
    }
    
    .info-item {
        margin-bottom: 10px;
        font-size: 14px;
    }
    
    .info-item strong {
        display: inline-block;
        width: 80px;
    }
    
    .actions-section {
        margin-top: 20px;
    }
    
    .actions-section button {
        margin-right: 10px;
    }
</style>
