// Productos de ejemplo
const products = [
    { id: 1, name: "Producto 1", price: 100, image: "https://via.placeholder.com/150" },
    { id: 2, name: "Producto 2", price: 200, image: "https://via.placeholder.com/150" },
    { id: 3, name: "Producto 3", price: 150, image: "https://via.placeholder.com/150" },
    { id: 4, name: "Producto 4", price: 300, image: "https://via.placeholder.com/150" },
    { id: 5, name: "Producto 5", price: 250, image: "https://via.placeholder.com/150" },
    { id: 6, name: "Producto 6", price: 180, image: "https://via.placeholder.com/150" }
];

// Elementos DOM
const productsContainer = document.getElementById('products-container');
const selectedProductsContainer = document.getElementById('selected-products');
const totalPriceElement = document.getElementById('total-price');
const orderForm = document.getElementById('order-form');

// Variables globales
let selectedProducts = [];
let confirmationModal;

// Cargar productos
function loadProducts() {
    products.forEach(product => {
        const productCol = document.createElement('div');
        productCol.className = 'col-md-4 col-sm-6 mb-4';
        
        productCol.innerHTML = `
            <div class="card product-card" data-id="${product.id}">
                <img src="${product.image}" class="card-img-top product-image" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">$${product.price.toFixed(2)}</p>
                    <button class="btn btn-sm btn-outline-primary select-product">Seleccionar</button>
                </div>
            </div>
        `;
        
        productsContainer.appendChild(productCol);
        
        // Evento de selección
        const selectButton = productCol.querySelector('.select-product');
        selectButton.addEventListener('click', () => toggleProductSelection(product));
    });
}

// Seleccionar/deseleccionar producto
function toggleProductSelection(product) {
    const productCard = document.querySelector(`.product-card[data-id="${product.id}"]`);
    
    const isSelected = selectedProducts.some(p => p.id === product.id);
    
    if (isSelected) {
        // Deseleccionar
        selectedProducts = selectedProducts.filter(p => p.id !== product.id);
        productCard.classList.remove('selected');
    } else {
        // Seleccionar
        selectedProducts.push(product);
        productCard.classList.add('selected');
    }
    
    updateOrderSummary();
}

// Actualizar resumen del pedido
function updateOrderSummary() {
    if (selectedProducts.length === 0) {
        selectedProductsContainer.innerHTML = '<p>No hay productos seleccionados</p>';
        totalPriceElement.textContent = '$0.00';
        return;
    }
    
    let total = 0;
    let html = '<ul class="list-group">';
    
    selectedProducts.forEach(product => {
        total += product.price;
        html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${product.name}
                <span>$${product.price.toFixed(2)}</span>
            </li>
        `;
    });
    
    html += '</ul>';
    selectedProductsContainer.innerHTML = html;
    totalPriceElement.textContent = `$${total.toFixed(2)}`;
}

// Enviar pedido
async function submitOrder(event) {
    event.preventDefault();
    
    if (selectedProducts.length === 0) {
        alert('Por favor selecciona al menos un producto');
        return;
    }
    
    // Recopilar datos del formulario
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const reference = document.getElementById('reference').value;
    const paymentProofFile = document.getElementById('payment-proof').files[0];
    
    if (!paymentProofFile) {
        alert('Por favor sube un comprobante de pago');
        return;
    }
    
    try {
        // Subir comprobante a Firebase Storage
        const timestamp = new Date().getTime();
        const storageRef = storage.ref(`comprobantes/${timestamp}_${paymentProofFile.name}`);
        await storageRef.put(paymentProofFile);
        const paymentProofUrl = await storageRef.getDownloadURL();
        
        // Calcular total
        const total = selectedProducts.reduce((sum, product) => sum + product.price, 0);
        
        // Crear objeto de pedido
        const order = {
            timestamp: timestamp,
            date: new Date().toLocaleString(),
            customer: name,
            phone: phone,
            reference: reference,
            products: selectedProducts,
            total: total,
            paymentProofUrl: paymentProofUrl
        };
        
        // Guardar en Firebase Database
        await database.ref('orders').push(order);
        
        // Mostrar confirmación
        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();
        
        // Reiniciar formulario
        orderForm.reset();
        selectedProducts = [];
        updateOrderSummary();
        
        // Reiniciar selección visual
        document.querySelectorAll('.product-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
    } catch (error) {
        console.error('Error al enviar el pedido:', error);
        alert('Ocurrió un error al enviar el pedido. Por favor intenta de nuevo.');
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    orderForm.addEventListener('submit', submitOrder);
    
    // Inicializar modal
    confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
});