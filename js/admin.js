// Elementos DOM
const ordersContainer = document.getElementById('orders-container');
const orderDetailsContent = document.getElementById('order-details-content');

// Cargar pedidos desde Firebase
function loadOrders() {
    const ordersRef = database.ref('orders');
    
    ordersRef.on('value', (snapshot) => {
        ordersContainer.innerHTML = '';
        
        if (!snapshot.exists()) {
            ordersContainer.innerHTML = '<tr><td colspan="8" class="text-center">No hay pedidos registrados</td></tr>';
            return;
        }
        
        // Convertir a array y ordenar por fecha (más recientes primero)
        const orders = [];
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            order.id = childSnapshot.key;
            orders.push(order);
        });
        
        orders.sort((a, b) => b.timestamp - a.timestamp);
        
        // Mostrar órdenes
        orders.forEach(order => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${order.date}</td>
                <td>${order.customer}</td>
                <td>${order.phone}</td>
                <td>${order.products.length} productos</td>
                <td>$${order.total.toFixed(2)}</td>
                <td>${order.reference || '-'}</td>
                <td>
                    <a href="${order.paymentProofUrl}" target="_blank" class="btn btn-sm btn-info">
                        Ver Comprobante
                    </a>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action view-details" data-id="${order.id}">
                        Detalles
                    </button>
                </td>
            `;
            
            ordersContainer.appendChild(tr);
            
            // Evento para ver detalles
            const viewButton = tr.querySelector('.view-details');
            viewButton.addEventListener('click', () => showOrderDetails(order));
        });
    });
}

// Mostrar detalles del pedido
function showOrderDetails(order) {
    let productsHtml = '';
    
    order.products.forEach(product => {
        productsHtml += `
            <div class="d-flex justify-content-between mb-2">
                <span>${product.name}</span>
                <span>$${product.price.toFixed(2)}</span>
            </div>
        `;
    });
    
    orderDetailsContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h5>Información del Cliente</h5>
                <p><strong>Nombre:</strong> ${order.customer}</p>
                <p><strong>Teléfono:</strong> ${order.phone}</p>
                <p><strong>Referencia:</strong> ${order.reference || 'No proporcionada'}</p>
                <p><strong>Fecha:</strong> ${order.date}</p>
            </div>
            <div class="col-md-6">
                <h5>Productos</h5>
                <div class="card">
                    <div class="card-body">
                        ${productsHtml}
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>Total:</strong>
                            <strong>$${order.total.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <h5>Comprobante de Pago</h5>
                <div class="text-center">
                    <img src="${order.paymentProofUrl}" alt="Comprobante" class="img-fluid" style="max-height: 300px;">
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
