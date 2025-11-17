// Cargar y mostrar vuelos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Solo cargar vuelos si estamos en la página de inicio
    if (document.getElementById('lista-vuelos')) {
        cargarVuelos();
    }
});

// Función para cargar vuelos desde el JSON + localStorage
async function cargarVuelos() {
    try {
        const response = await fetch('./data/vuelos.json');
        const data = await response.json();
        
        // Cargar también vuelos agregados por el agente desde localStorage
        const vuelosAgente = JSON.parse(localStorage.getItem('vuelos-agente')) || [];
        
        // Combinar vuelos del JSON con los del localStorage
        const todosLosVuelos = [...data.vuelos, ...vuelosAgente];
        
        // Guardar en sessionStorage para uso posterior
        sessionStorage.setItem('vuelos', JSON.stringify(todosLosVuelos));
        
        mostrarVuelos(todosLosVuelos);
    } catch (error) {
        console.error('Error al cargar vuelos:', error);
        
        // Mostrar error con SweetAlert2
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar vuelos',
            text: 'No se pudieron cargar los vuelos. Por favor, intenta más tarde.',
            confirmButtonColor: '#0066cc'
        });
    }
}

// Función para mostrar vuelos en la página (solo para index.html)
function mostrarVuelos(vuelos) {
    const container = document.getElementById('lista-vuelos');
    
    // Verificar que el contenedor exista
    if (!container) {
        console.warn('El contenedor lista-vuelos no existe en esta página');
        return;
    }
    
    if (!vuelos || vuelos.length === 0) {
        container.innerHTML = `
            <div class="card text-center" style="grid-column: 1 / -1;">
                <p style="font-size: 1.2rem; color: #666;">
                    ℹ️ No se encontraron vuelos con los criterios seleccionados.
                </p>
            </div>
        `;
        
        // Toast informativo
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        
        Toast.fire({
            icon: 'info',
            title: 'No hay vuelos disponibles'
        });
        
        return;
    }
    
    container.innerHTML = '';
    
    vuelos.forEach(vuelo => {
        const estadoBadge = vuelo.estadoVuelo === 'ACTIVO' 
            ? '<span class="badge badge-success">Disponible</span>'
            : '<span class="badge badge-danger">Completo</span>';
        
        const vueloCard = `
            <div class="vuelo-card">
                <div class="vuelo-header">${vuelo.destino}</div>
                <div class="vuelo-info">
                    <strong>Vuelo:</strong> ${vuelo.idVuelo}<br>
                    <strong>Origen:</strong> ${vuelo.origen}<br>
                    <strong>Fecha:</strong> ${formatearFecha(vuelo.fechaSalida)}<br>
                    <strong>Hora:</strong> ${vuelo.horaSalida}<br>
                    <strong>Duración:</strong> ${vuelo.duracion}<br>
                    <strong>Asientos:</strong> ${vuelo.asientosDisponibles} / ${vuelo.capacidad}
                </div>
                <div class="vuelo-precio">$${vuelo.precio.toFixed(2)}</div>
                ${estadoBadge}
                <br><br>
                ${vuelo.asientosDisponibles > 0 
                    ? `<button class="btn btn-primary" onclick="mostrarAlertaLogin('${vuelo.idVuelo}')">Ver Detalles</button>`
                    : `<button class="btn btn-danger" disabled>No Disponible</button>`
                }
            </div>
        `;
        
        container.innerHTML += vueloCard;
    });
    
    // Toast de éxito al cargar vuelos
    if (vuelos.length > 0) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        
        Toast.fire({
            icon: 'success',
            title: `${vuelos.length} vuelo(s) encontrado(s)`
        });
    }
}

// Función para filtrar vuelos (solo para index.html)
function filtrarVuelos() {
    const destino = document.getElementById('filtro-destino').value.toLowerCase().trim();
    const fecha = document.getElementById('filtro-fecha').value;
    
    // Validar que al menos un filtro esté activo
    if (!destino && !fecha) {
        Swal.fire({
            icon: 'warning',
            title: 'Filtros vacíos',
            text: 'Por favor, ingresa al menos un criterio de búsqueda.',
            confirmButtonColor: '#0066cc'
        });
        return;
    }
    
    const vuelosGuardados = JSON.parse(sessionStorage.getItem('vuelos')) || [];
    
    let vuelosFiltrados = vuelosGuardados.filter(vuelo => {
        const coincideDestino = !destino || vuelo.destino.toLowerCase().includes(destino) || 
                                vuelo.origen.toLowerCase().includes(destino);
        const coincideFecha = !fecha || vuelo.fechaSalida === fecha;
        return coincideDestino && coincideFecha;
    });
    
    mostrarVuelos(vuelosFiltrados);
}

// Función para limpiar filtros (solo para index.html)
function limpiarFiltros() {
    // Limpiar campos de filtro
    document.getElementById('filtro-destino').value = '';
    document.getElementById('filtro-fecha').value = '';
    
    // Recargar todos los vuelos
    const vuelosGuardados = JSON.parse(sessionStorage.getItem('vuelos')) || [];
    mostrarVuelos(vuelosGuardados);
    
    // Toast de confirmación
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });
    
    Toast.fire({
        icon: 'success',
        title: 'Filtros limpiados'
    });
}

// Formatear fecha (función reutilizable en todas las páginas)
function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', opciones);
}

// Mostrar alerta para iniciar sesión con SweetAlert2
function mostrarAlertaLogin(idVuelo) {
    Swal.fire({
        title: '🔒 Inicio de sesión requerido',
        text: 'Debes iniciar sesión para reservar un vuelo.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#0066cc',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ir a Login',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.setItem('vuelo-seleccionado', idVuelo);
            window.location.href = 'login.html';
        }
    });
}
