// Variables globales
let agenteActual = null;
let vuelosAgente = [];

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacionAgente();
    cargarDatosAgente();
    cargarVuelosAgente();
});

// Verificar si el agente está autenticado
function verificarAutenticacionAgente() {
    const tipoUsuario = sessionStorage.getItem('tipo-usuario');
    
    if (!estaAutenticado() || tipoUsuario !== 'agente') {
        mostrarError('Acceso denegado', 'Debes iniciar sesión como agente para acceder a esta página.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

// Cargar datos del agente
function cargarDatosAgente() {
    agenteActual = obtenerUsuarioActual();
    
    if (!agenteActual) return;
    
    // Mostrar nombre en navbar
    document.getElementById('agente-nombre').textContent = agenteActual.nombre;
    
    // Mostrar bienvenida
    document.getElementById('bienvenida-agente').textContent = `¡Hola, ${agenteActual.nombre}!`;
}

// Cambiar entre secciones (tabs)
function cambiarSeccionAgente(seccion) {
    const tabVuelos = document.getElementById('tab-vuelos');
    const tabEstadisticas = document.getElementById('tab-estadisticas');
    const seccionVuelos = document.getElementById('seccion-vuelos');
    const seccionEstadisticas = document.getElementById('seccion-estadisticas');
    
    if (seccion === 'vuelos') {
        tabVuelos.classList.remove('btn-outline');
        tabVuelos.classList.add('btn-primary');
        tabEstadisticas.classList.remove('btn-primary');
        tabEstadisticas.classList.add('btn-outline');
        
        seccionVuelos.classList.remove('hidden');
        seccionEstadisticas.classList.add('hidden');
    } else {
        tabEstadisticas.classList.remove('btn-outline');
        tabEstadisticas.classList.add('btn-primary');
        tabVuelos.classList.remove('btn-primary');
        tabVuelos.classList.add('btn-outline');
        
        seccionEstadisticas.classList.remove('hidden');
        seccionVuelos.classList.add('hidden');
        
        calcularEstadisticas();
    }
}

// Cargar vuelos
async function cargarVuelosAgente() {
    try {
        const response = await fetch('./data/vuelos.json');
        const data = await response.json();
        
        // Cargar vuelos adicionales de localStorage
        const vuelosLocal = JSON.parse(localStorage.getItem('vuelos-agente')) || [];
        
        vuelosAgente = [...data.vuelos, ...vuelosLocal];
        
        mostrarVuelosTabla(vuelosAgente);
        actualizarTotalVuelos();
    } catch (error) {
        console.error('Error al cargar vuelos:', error);
        mostrarError('Error', 'No se pudieron cargar los vuelos.');
    }
}

// Mostrar vuelos en tabla
function mostrarVuelosTabla(vuelos) {
    const tbody = document.getElementById('tabla-vuelos-body');
    
    if (!vuelos || vuelos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-light);">
                    No hay vuelos disponibles
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    vuelos.forEach(vuelo => {
        let estadoBadge;
        if (vuelo.estadoVuelo === 'ACTIVO') {
            estadoBadge = '<span class="badge badge-success">Activo</span>';
        } else if (vuelo.estadoVuelo === 'COMPLETO') {
            estadoBadge = '<span class="badge badge-danger">Completo</span>';
        } else {
            estadoBadge = '<span class="badge" style="background: #6c757d; color: white;">Cancelado</span>';
        }
        
        const fila = `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;"><strong>${vuelo.idVuelo}</strong></td>
                <td style="padding: 12px;">${vuelo.origen}</td>
                <td style="padding: 12px;">${vuelo.destino}</td>
                <td style="padding: 12px;">${vuelo.fechaSalida}</td>
                <td style="padding: 12px;">${vuelo.horaSalida}</td>
                <td style="padding: 12px; text-align: center;">${vuelo.asientosDisponibles} / ${vuelo.capacidad}</td>
                <td style="padding: 12px; text-align: right;">$${vuelo.precio.toFixed(2)}</td>
                <td style="padding: 12px; text-align: center;">${estadoBadge}</td>
                <td style="padding: 12px; text-align: center;">
                    <button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.85rem;" onclick='editarVuelo(${JSON.stringify(vuelo)})'>
                        ✏️ Editar
                    </button>
                </td>
            </tr>
        `;
        
        tbody.innerHTML += fila;
    });
}

// Actualizar total de vuelos
function actualizarTotalVuelos() {
    document.getElementById('total-vuelos').textContent = vuelosAgente.length;
}

// Filtrar vuelos
function filtrarVuelosAgente() {
    const destino = document.getElementById('filtro-destino-agente').value.toLowerCase().trim();
    const estado = document.getElementById('filtro-estado-agente').value;
    
    let vuelosFiltrados = vuelosAgente.filter(vuelo => {
        const coincideDestino = !destino || vuelo.destino.toLowerCase().includes(destino) || 
                                vuelo.origen.toLowerCase().includes(destino);
        const coincideEstado = !estado || vuelo.estadoVuelo === estado;
        return coincideDestino && coincideEstado;
    });
    
    mostrarVuelosTabla(vuelosFiltrados);
    mostrarNotificacion(`${vuelosFiltrados.length} vuelo(s) encontrado(s)`, 'success');
}

// Mostrar formulario para nuevo vuelo
async function mostrarFormularioNuevoVuelo() {
    const { value: formValues } = await Swal.fire({
        title: '➕ Agregar Nuevo Vuelo',
        html: `
            <div style="text-align: left;">
                <div class="form-group">
                    <label>ID del Vuelo *</label>
                    <input type="text" id="nuevo-id" class="swal2-input" placeholder="FL006" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Origen *</label>
                    <input type="text" id="nuevo-origen" class="swal2-input" placeholder="Santo Domingo (SDQ)" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Destino *</label>
                    <input type="text" id="nuevo-destino" class="swal2-input" placeholder="Miami (MIA)" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Fecha de Salida *</label>
                    <input type="date" id="nuevo-fecha" class="swal2-input" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Hora de Salida *</label>
                    <input type="time" id="nuevo-hora" class="swal2-input" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Capacidad Total *</label>
                    <input type="number" id="nuevo-capacidad" class="swal2-input" placeholder="180" min="50" max="400" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Precio (USD) *</label>
                    <input type="number" id="nuevo-precio" class="swal2-input" placeholder="350.00" min="50" step="0.01" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Duración *</label>
                    <input type="text" id="nuevo-duracion" class="swal2-input" placeholder="2h 30m" style="width: 90%;">
                </div>
            </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Agregar Vuelo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#00cc66',
        preConfirm: () => {
            const id = document.getElementById('nuevo-id').value.trim();
            const origen = document.getElementById('nuevo-origen').value.trim();
            const destino = document.getElementById('nuevo-destino').value.trim();
            const fecha = document.getElementById('nuevo-fecha').value;
            const hora = document.getElementById('nuevo-hora').value;
            const capacidad = parseInt(document.getElementById('nuevo-capacidad').value);
            const precio = parseFloat(document.getElementById('nuevo-precio').value);
            const duracion = document.getElementById('nuevo-duracion').value.trim();
            
            if (!id || !origen || !destino || !fecha || !hora || !capacidad || !precio || !duracion) {
                Swal.showValidationMessage('Por favor completa todos los campos');
                return false;
            }
            
            return { id, origen, destino, fecha, hora, capacidad, precio, duracion };
        }
    });
    
    if (formValues) {
        agregarNuevoVuelo(formValues);
    }
}

// Agregar nuevo vuelo
function agregarNuevoVuelo(datos) {
    mostrarCargando('Agregando vuelo...', 'Por favor espera');
    
    setTimeout(() => {
        // Verificar si el ID ya existe
        const idExiste = vuelosAgente.find(v => v.idVuelo === datos.id);
        
        if (idExiste) {
            cerrarCargando();
            mostrarError('ID duplicado', 'Ya existe un vuelo con ese ID. Por favor usa otro.');
            return;
        }
        
        const nuevoVuelo = {
            idVuelo: datos.id,
            origen: datos.origen,
            destino: datos.destino,
            fechaSalida: datos.fecha,
            horaSalida: datos.hora,
            capacidad: datos.capacidad,
            asientosDisponibles: datos.capacidad,
            precio: datos.precio,
            duracion: datos.duracion,
            estadoVuelo: 'ACTIVO'
        };
        
        // Guardar en localStorage
        const vuelosLocal = JSON.parse(localStorage.getItem('vuelos-agente')) || [];
        vuelosLocal.push(nuevoVuelo);
        localStorage.setItem('vuelos-agente', JSON.stringify(vuelosLocal));
        
        // IMPORTANTE: Limpiar sessionStorage para forzar recarga en otras páginas
        sessionStorage.removeItem('vuelos');
        
        vuelosAgente.push(nuevoVuelo);
        
        cerrarCargando();
        
        Swal.fire({
            icon: 'success',
            title: 'Vuelo agregado',
            html: `
                <p>El vuelo <strong>${datos.id}</strong> ha sido agregado exitosamente.</p>
                <p style="color: var(--secondary-color); margin-top: 10px;">
                    ✅ Visible ahora en todas las páginas del sistema
                </p>
            `,
            confirmButtonColor: '#00cc66'
        });
        
        cargarVuelosAgente();
    }, 1000);
}

// Editar vuelo
async function editarVuelo(vuelo) {
    const { value: formValues } = await Swal.fire({
        title: `✏️ Editar Vuelo ${vuelo.idVuelo}`,
        html: `
            <div style="text-align: left;">
                <div class="form-group">
                    <label>Origen</label>
                    <input type="text" id="edit-origen" class="swal2-input" value="${vuelo.origen}" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Destino</label>
                    <input type="text" id="edit-destino" class="swal2-input" value="${vuelo.destino}" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Fecha de Salida</label>
                    <input type="date" id="edit-fecha" class="swal2-input" value="${vuelo.fechaSalida}" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Hora de Salida</label>
                    <input type="time" id="edit-hora" class="swal2-input" value="${vuelo.horaSalida}" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Asientos Disponibles</label>
                    <input type="number" id="edit-asientos" class="swal2-input" value="${vuelo.asientosDisponibles}" max="${vuelo.capacidad}" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Precio (USD)</label>
                    <input type="number" id="edit-precio" class="swal2-input" value="${vuelo.precio}" step="0.01" style="width: 90%;">
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <select id="edit-estado" class="swal2-input" style="width: 90%;">
                        <option value="ACTIVO" ${vuelo.estadoVuelo === 'ACTIVO' ? 'selected' : ''}>Activo</option>
                        <option value="COMPLETO" ${vuelo.estadoVuelo === 'COMPLETO' ? 'selected' : ''}>Completo</option>
                        <option value="CANCELADO" ${vuelo.estadoVuelo === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </div>
            </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0066cc',
        preConfirm: () => {
            return {
                origen: document.getElementById('edit-origen').value.trim(),
                destino: document.getElementById('edit-destino').value.trim(),
                fecha: document.getElementById('edit-fecha').value,
                hora: document.getElementById('edit-hora').value,
                asientos: parseInt(document.getElementById('edit-asientos').value),
                precio: parseFloat(document.getElementById('edit-precio').value),
                estado: document.getElementById('edit-estado').value
            };
        }
    });
    
    if (formValues) {
        guardarCambiosVuelo(vuelo.idVuelo, formValues);
    }
}

// Guardar cambios del vuelo
function guardarCambiosVuelo(idVuelo, cambios) {
    mostrarCargando('Guardando cambios...', 'Por favor espera');
    
    setTimeout(() => {
        // Buscar y actualizar el vuelo
        const index = vuelosAgente.findIndex(v => v.idVuelo === idVuelo);
        
        if (index !== -1) {
            vuelosAgente[index].origen = cambios.origen;
            vuelosAgente[index].destino = cambios.destino;
            vuelosAgente[index].fechaSalida = cambios.fecha;
            vuelosAgente[index].horaSalida = cambios.hora;
            vuelosAgente[index].asientosDisponibles = cambios.asientos;
            vuelosAgente[index].precio = cambios.precio;
            vuelosAgente[index].estadoVuelo = cambios.estado;
            
            // Actualizar en localStorage
            const vuelosLocal = JSON.parse(localStorage.getItem('vuelos-agente')) || [];
            const indexLocal = vuelosLocal.findIndex(v => v.idVuelo === idVuelo);
            
            if (indexLocal !== -1) {
                vuelosLocal[indexLocal] = vuelosAgente[index];
                localStorage.setItem('vuelos-agente', JSON.stringify(vuelosLocal));
            }
            
            // IMPORTANTE: Limpiar sessionStorage para forzar recarga
            sessionStorage.removeItem('vuelos');
            
            cerrarCargando();
            mostrarExito('Cambios guardados', `El vuelo ${idVuelo} ha sido actualizado.`);
            
            cargarVuelosAgente();
        }
    }, 1000);
}

// Calcular estadísticas
function calcularEstadisticas() {
    const vuelosActivos = vuelosAgente.filter(v => v.estadoVuelo === 'ACTIVO').length;
    const totalAsientos = vuelosAgente.reduce((sum, v) => sum + v.capacidad, 0);
    const asientosDisponibles = vuelosAgente.reduce((sum, v) => sum + v.asientosDisponibles, 0);
    const ocupacion = totalAsientos > 0 ? ((totalAsientos - asientosDisponibles) / totalAsientos * 100).toFixed(1) : 0;
    
    document.getElementById('stat-vuelos-activos').textContent = vuelosActivos;
    document.getElementById('stat-total-asientos').textContent = totalAsientos.toLocaleString();
    document.getElementById('stat-asientos-disponibles').textContent = asientosDisponibles.toLocaleString();
    document.getElementById('stat-ocupacion').textContent = ocupacion + '%';
    
    // Destinos más populares
    const destinosMap = {};
    vuelosAgente.forEach(vuelo => {
        const destino = vuelo.destino.split('(')[0].trim();
        if (destinosMap[destino]) {
            destinosMap[destino]++;
        } else {
            destinosMap[destino] = 1;
        }
    });
    
    const destinosOrdenados = Object.entries(destinosMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const destinosHTML = destinosOrdenados.map((dest, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color);">
            <span><strong>${index + 1}.</strong> ${dest[0]}</span>
            <span class="badge badge-success">${dest[1]} vuelo(s)</span>
        </div>
    `).join('');
    
    document.getElementById('destinos-populares').innerHTML = destinosHTML || '<p style="color: var(--text-light);">No hay datos disponibles</p>';
}
