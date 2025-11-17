// Variables globales
let usuarioActual = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
    cargarDatosUsuario();
    cargarVuelosPanel();
    cargarReservasUsuario();
});

// Verificar si el usuario está autenticado
function verificarAutenticacion() {
    const tipoUsuario = sessionStorage.getItem('tipo-usuario');
    
    if (!estaAutenticado() || tipoUsuario !== 'cliente') {
        mostrarError('Acceso denegado', 'Debes iniciar sesión como cliente para acceder a esta página.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

// Cargar datos del usuario
function cargarDatosUsuario() {
    usuarioActual = obtenerUsuarioActual();
    
    if (!usuarioActual) return;
    
    // Mostrar nombre en navbar
    document.getElementById('usuario-nombre').textContent = usuarioActual.nombreCompleto;
    
    // Mostrar bienvenida
    document.getElementById('bienvenida-usuario').textContent = `¡Hola, ${usuarioActual.nombreCompleto.split(' ')[0]}!`;
    
    // Badge de tipo de cliente
    const tipoBadge = document.getElementById('tipo-cliente-badge');
    if (usuarioActual.tipoCliente === 'CORPORATIVO') {
        tipoBadge.innerHTML = '<span class="badge badge-warning">⭐ Cliente Corporativo</span>';
        
        // Mostrar sección de millas
        document.getElementById('info-millas').classList.remove('hidden');
        document.getElementById('saldo-millas').textContent = usuarioActual.saldoMillas.toLocaleString();
    } else {
        tipoBadge.innerHTML = '<span class="badge badge-success">Cliente Minorista</span>';
    }
}

// Cambiar entre secciones (tabs)
function cambiarSeccion(seccion) {
    const tabBuscar = document.getElementById('tab-buscar');
    const tabReservas = document.getElementById('tab-reservas');
    const seccionBuscar = document.getElementById('seccion-buscar');
    const seccionReservas = document.getElementById('seccion-reservas');
    
    if (seccion === 'buscar') {
        tabBuscar.classList.remove('btn-outline');
        tabBuscar.classList.add('btn-primary');
        tabReservas.classList.remove('btn-primary');
        tabReservas.classList.add('btn-outline');
        
        seccionBuscar.classList.remove('hidden');
        seccionReservas.classList.add('hidden');
    } else {
        tabReservas.classList.remove('btn-outline');
        tabReservas.classList.add('btn-primary');
        tabBuscar.classList.remove('btn-primary');
        tabBuscar.classList.add('btn-outline');
        
        seccionReservas.classList.remove('hidden');
        seccionBuscar.classList.add('hidden');
        
        cargarReservasUsuario();
    }
}

// Cargar vuelos en el panel
async function cargarVuelosPanel() {
    try {
        const response = await fetch('./data/vuelos.json');
        const data = await response.json();
        
        // Cargar también vuelos agregados por el agente desde localStorage
        const vuelosAgente = JSON.parse(localStorage.getItem('vuelos-agente')) || [];
        
        // Combinar vuelos del JSON con los del localStorage
        const todosLosVuelos = [...data.vuelos, ...vuelosAgente];
        
        sessionStorage.setItem('vuelos', JSON.stringify(todosLosVuelos));
        mostrarVuelosPanel(todosLosVuelos);
    } catch (error) {
        console.error('Error al cargar vuelos:', error);
        mostrarError('Error', 'No se pudieron cargar los vuelos.');
    }
}

// Mostrar vuelos en el panel
function mostrarVuelosPanel(vuelos) {
    const container = document.getElementById('lista-vuelos-panel');
    
    if (!vuelos || vuelos.length === 0) {
        container.innerHTML = `
            <div class="card text-center" style="grid-column: 1 / -1;">
                <p>No se encontraron vuelos disponibles.</p>
            </div>
        `;
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
                    ? `<button class="btn btn-primary" onclick='iniciarReserva(${JSON.stringify(vuelo)})'>Reservar Ahora</button>`
                    : `<button class="btn btn-danger" disabled>No Disponible</button>`
                }
            </div>
        `;
        
        container.innerHTML += vueloCard;
    });
}

// Filtrar vuelos en el panel
function filtrarVuelosPanel() {
    const destino = document.getElementById('filtro-destino-panel').value.toLowerCase().trim();
    const fecha = document.getElementById('filtro-fecha-panel').value;
    
    if (!destino && !fecha) {
        mostrarAdvertencia('Filtros vacíos', 'Por favor, ingresa al menos un criterio de búsqueda.');
        return;
    }
    
    // Validar que la fecha no sea pasada
    if (fecha) {
        const fechaSeleccionada = new Date(fecha + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaSeleccionada < hoy) {
            Swal.fire({
                icon: 'error',
                title: '📅 Fecha Inválida',
                html: `
                    <p>La fecha seleccionada ya pasó.</p>
                    <p style="color: var(--text-light);">Por favor, selecciona una fecha futura.</p>
                `,
                confirmButtonColor: '#dc3545'
            });
            return;
        }
    }
    
    const vuelos = JSON.parse(sessionStorage.getItem('vuelos')) || [];
    
    const vuelosFiltrados = vuelos.filter(vuelo => {
        const coincideDestino = !destino || vuelo.destino.toLowerCase().includes(destino) || 
                                vuelo.origen.toLowerCase().includes(destino);
        const coincideFecha = !fecha || vuelo.fechaSalida === fecha;
        return coincideDestino && coincideFecha;
    });
    
    mostrarVuelosPanel(vuelosFiltrados);
    mostrarNotificacion(`${vuelosFiltrados.length} vuelo(s) encontrado(s)`, 'success');
}

// Limpiar filtros
function limpiarFiltrosPanel() {
    document.getElementById('filtro-destino-panel').value = '';
    document.getElementById('filtro-fecha-panel').value = '';
    
    const vuelos = JSON.parse(sessionStorage.getItem('vuelos')) || [];
    mostrarVuelosPanel(vuelos);
    mostrarNotificacion('Filtros limpiados', 'success');
}

// Iniciar proceso de reserva
async function iniciarReserva(vuelo) {
    // Generar asientos disponibles aleatorios
    const asientosDisponibles = generarAsientosDisponibles(vuelo);
    
    const { value: formValues } = await Swal.fire({
        title: `Reservar ${vuelo.destino}`,
        html: `
            <div style="text-align: left;">
                <p><strong>Vuelo:</strong> ${vuelo.idVuelo}</p>
                <p><strong>Salida:</strong> ${formatearFecha(vuelo.fechaSalida)} - ${vuelo.horaSalida}</p>
                <p><strong>Duración:</strong> ${vuelo.duracion}</p>
                <p><strong>Precio:</strong> $${vuelo.precio.toFixed(2)}</p>
                <hr>
                <label for="asiento-select" style="display: block; margin-top: 10px; font-weight: 600;">Selecciona tu asiento:</label>
                <select id="asiento-select" class="swal2-input" style="width: 100%; padding: 10px;">
                    ${asientosDisponibles.map(asiento => `<option value="${asiento}">${asiento}</option>`).join('')}
                </select>
                
                ${usuarioActual.tipoCliente === 'CORPORATIVO' && usuarioActual.saldoMillas >= 100 ? `
                    <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="usar-millas" style="margin-right: 10px;">
                            <span>Usar millas para descuento (Tienes: ${usuarioActual.saldoMillas})</span>
                        </label>
                        <small style="color: #856404; display: block; margin-top: 5px;">
                            100 millas = $10 de descuento
                        </small>
                    </div>
                ` : ''}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar al Pago',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0066cc',
        preConfirm: () => {
            const asiento = document.getElementById('asiento-select').value;
            const usarMillas = document.getElementById('usar-millas')?.checked || false;
            return { asiento, usarMillas };
        }
    });
    
    if (formValues) {
        procesarPago(vuelo, formValues.asiento, formValues.usarMillas);
    }
}

// Generar asientos disponibles ficticios
function generarAsientosDisponibles(vuelo) {
    const asientos = [];
    const filas = ['A', 'B', 'C', 'D', 'E', 'F'];
    const numFilas = Math.min(30, Math.ceil(vuelo.capacidad / 6));
    
    for (let i = 1; i <= 10; i++) {
        const fila = Math.floor(Math.random() * numFilas) + 1;
        const columna = filas[Math.floor(Math.random() * filas.length)];
        const asiento = `${fila}${columna}`;
        if (!asientos.includes(asiento)) {
            asientos.push(asiento);
        }
    }
    
    return asientos.sort();
}

// Procesar pago
async function procesarPago(vuelo, asiento, usarMillas) {
    // Simulación: 10% de probabilidad de que el asiento ya esté ocupado
    const asientoOcupado = Math.random() < 0.1;
    
    if (asientoOcupado) {
        const { value: nuevoAsiento } = await Swal.fire({
            icon: 'warning',
            title: '⚠️ Asiento No Disponible',
            html: `
                <p>Lo sentimos, el asiento <strong>${asiento}</strong> acaba de ser reservado por otro usuario.</p>
                <hr>
                <label style="display: block; margin-top: 15px; font-weight: 600;">Selecciona otro asiento disponible:</label>
                <select id="nuevo-asiento" class="swal2-input" style="width: 90%;">
                    ${generarAsientosDisponibles(vuelo).filter(a => a !== asiento).slice(0, 5).map(a => `<option value="${a}">${a}</option>`).join('')}
                </select>
            `,
            showCancelButton: true,
            confirmButtonText: 'Continuar con nuevo asiento',
            cancelButtonText: 'Cancelar reserva',
            confirmButtonColor: '#0066cc',
            preConfirm: () => {
                return document.getElementById('nuevo-asiento').value;
            }
        });
        
        if (!nuevoAsiento) return; // Usuario canceló
        
        asiento = nuevoAsiento; // Usar el nuevo asiento
    }
    
    let precioFinal = vuelo.precio;
    let descuento = 0;
    let millasUsadas = 0;
    
    // Aplicar descuento si usa millas
    if (usarMillas && usuarioActual.tipoCliente === 'CORPORATIVO') {
        const millasDisponibles = usuarioActual.saldoMillas;
        millasUsadas = Math.min(millasDisponibles, Math.floor(vuelo.precio * 10));
        descuento = millasUsadas / 10;
        precioFinal = vuelo.precio - descuento;
    }
    
    // Simular pasarela de pago
    const { value: metodoPago } = await Swal.fire({
        title: 'Método de Pago',
        html: `
            <div style="text-align: left;">
                <h3 style="margin-bottom: 15px;">Resumen de Reserva</h3>
                <p><strong>Vuelo:</strong> ${vuelo.idVuelo} - ${vuelo.destino}</p>
                <p><strong>Asiento:</strong> ${asiento}</p>
                <p><strong>Precio original:</strong> $${vuelo.precio.toFixed(2)}</p>
                ${descuento > 0 ? `
                    <p style="color: var(--secondary-color);"><strong>Descuento (${millasUsadas} millas):</strong> -$${descuento.toFixed(2)}</p>
                ` : ''}
                <p style="font-size: 1.3rem; color: var(--primary-color);"><strong>Total a pagar:</strong> $${precioFinal.toFixed(2)}</p>
                <hr>
                <label style="display: block; margin-top: 15px; font-weight: 600;">Selecciona método de pago:</label>
                <select id="metodo-pago" class="swal2-input" style="width: 100%; padding: 10px;">
                    <option value="Tarjeta de Crédito">💳 Tarjeta de Crédito</option>
                    <option value="Tarjeta de Débito">💳 Tarjeta de Débito</option>
                    <option value="PayPal">💰 PayPal</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar Pago',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#00cc66',
        preConfirm: () => {
            return document.getElementById('metodo-pago').value;
        }
    });
    
    if (metodoPago) {
        // Simulación: 5% de probabilidad de pago rechazado
        const pagoRechazado = Math.random() < 0.05;
        
        if (pagoRechazado) {
            const { value: reintentar } = await Swal.fire({
                icon: 'error',
                title: '❌ Pago Rechazado',
                html: `
                    <p>Tu tarjeta fue declinada.</p>
                    <p style="color: var(--text-light);">
                        Posibles razones: fondos insuficientes, tarjeta vencida, o límite excedido.
                    </p>
                `,
                showCancelButton: true,
                confirmButtonText: 'Intentar con otro método',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#ffc107'
            });
            
            if (reintentar) {
                // Reintentar proceso de pago
                procesarPago(vuelo, asiento, usarMillas);
            }
            return;
        }
        
        confirmarReserva(vuelo, asiento, precioFinal, descuento, millasUsadas, metodoPago);
    }
}

// Confirmar reserva
function confirmarReserva(vuelo, asiento, total, descuento, millasUsadas, metodoPago) {
    mostrarCargando('Procesando pago...', 'Por favor espera');
    
    setTimeout(() => {
        // Crear nueva reserva
        const nuevaReserva = {
            idReserva: `RES${Date.now()}`,
            idCliente: usuarioActual.idCliente,
            idVuelo: vuelo.idVuelo,
            destino: vuelo.destino,
            origen: vuelo.origen,
            fechaSalida: vuelo.fechaSalida,
            horaSalida: vuelo.horaSalida,
            numeroAsiento: asiento,
            fechaReserva: new Date().toISOString(),
            estado: 'CONFIRMADA',
            total: total,
            descuentoAplicado: descuento,
            millasUsadas: millasUsadas,
            metodoPago: metodoPago
        };
        
        // Guardar reserva en localStorage
        const reservas = JSON.parse(localStorage.getItem('reservas-usuario')) || [];
        reservas.push(nuevaReserva);
        localStorage.setItem('reservas-usuario', JSON.stringify(reservas));
        
        // Actualizar millas del usuario
        if (millasUsadas > 0) {
            usuarioActual.saldoMillas -= millasUsadas;
            actualizarUsuarioEnStorage();
        }
        
        // Agregar millas ganadas (1 milla por cada $10 gastados, solo corporativos)
        if (usuarioActual.tipoCliente === 'CORPORATIVO') {
            const millasGanadas = Math.floor(total / 10);
            usuarioActual.saldoMillas += millasGanadas;
            actualizarUsuarioEnStorage();
        }
        
        cerrarCargando();
        
        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: '¡Reserva Confirmada!',
            html: `
                <div style="text-align: left;">
                    <p>Tu reserva ha sido procesada exitosamente.</p>
                    <hr>
                    <p><strong>Código de reserva:</strong> ${nuevaReserva.idReserva}</p>
                    <p><strong>Vuelo:</strong> ${vuelo.idVuelo} - ${vuelo.destino}</p>
                    <p><strong>Asiento:</strong> ${asiento}</p>
                    <p><strong>Total pagado:</strong> $${total.toFixed(2)}</p>
                    ${usuarioActual.tipoCliente === 'CORPORATIVO' ? `
                        <p style="color: var(--secondary-color);">✨ Has ganado ${Math.floor(total / 10)} millas</p>
                    ` : ''}
                    <hr>
                    <small>📧 Se ha enviado una confirmación a tu correo.</small>
                </div>
            `,
            confirmButtonColor: '#00cc66',
            confirmButtonText: 'Ver Mis Reservas'
        }).then((result) => {
            if (result.isConfirmed) {
                cambiarSeccion('reservas');
            }
        });
        
        // Recargar datos del usuario
        cargarDatosUsuario();
    }, 2000);
}

// Actualizar usuario en storage
function actualizarUsuarioEnStorage() {
    sessionStorage.setItem('usuario-actual', JSON.stringify(usuarioActual));
    
    // Actualizar también en localStorage si existe
    const usuariosRegistrados = JSON.parse(localStorage.getItem('usuarios-registrados')) || [];
    const index = usuariosRegistrados.findIndex(u => u.idCliente === usuarioActual.idCliente);
    
    if (index !== -1) {
        usuariosRegistrados[index] = usuarioActual;
        localStorage.setItem('usuarios-registrados', JSON.stringify(usuariosRegistrados));
    }
}

// Cargar reservas del usuario
function cargarReservasUsuario() {
    const reservasStorage = JSON.parse(localStorage.getItem('reservas-usuario')) || [];
    const reservasUsuario = reservasStorage.filter(r => r.idCliente === usuarioActual.idCliente);
    
    const container = document.getElementById('lista-reservas');
    
    if (reservasUsuario.length === 0) {
        container.innerHTML = `
            <div class="card text-center">
                <h3>📭 No tienes reservas</h3>
                <p style="color: var(--text-light);">Aún no has realizado ninguna reserva.</p>
                <button class="btn btn-primary mt-20" onclick="cambiarSeccion('buscar')">Buscar Vuelos</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    reservasUsuario.sort((a, b) => new Date(b.fechaReserva) - new Date(a.fechaReserva)).forEach(reserva => {
        const estadoBadge = reserva.estado === 'CONFIRMADA' 
            ? '<span class="badge badge-success">Confirmada</span>'
            : '<span class="badge badge-danger">Cancelada</span>';
        
        const puedeCancel = reserva.estado === 'CONFIRMADA' && new Date(reserva.fechaSalida) > new Date();
        
        const reservaCard = `
            <div class="card" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin-bottom: 10px;">${reserva.destino}</h3>
                        <p style="margin: 5px 0;"><strong>Código:</strong> ${reserva.idReserva}</p>
                        <p style="margin: 5px 0;"><strong>Vuelo:</strong> ${reserva.idVuelo}</p>
                        <p style="margin: 5px 0;"><strong>Origen:</strong> ${reserva.origen}</p>
                        <p style="margin: 5px 0;"><strong>Fecha de salida:</strong> ${formatearFecha(reserva.fechaSalida)} - ${reserva.horaSalida}</p>
                        <p style="margin: 5px 0;"><strong>Asiento:</strong> ${reserva.numeroAsiento}</p>
                        <p style="margin: 5px 0;"><strong>Fecha de reserva:</strong> ${formatearFechaHora(reserva.fechaReserva)}</p>
                    </div>
                    <div style="text-align: right; min-width: 200px;">
                        ${estadoBadge}
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin: 10px 0;">
                            $${reserva.total.toFixed(2)}
                        </p>
                        ${reserva.descuentoAplicado > 0 ? `
                            <p style="color: var(--secondary-color); font-size: 0.9rem;">
                                Descuento: -$${reserva.descuentoAplicado.toFixed(2)}
                            </p>
                        ` : ''}
                        <p style="font-size: 0.85rem; color: var(--text-light);">
                            ${reserva.metodoPago}
                        </p>
                        ${puedeCancel ? `
                            <button class="btn btn-danger mt-20" onclick='cancelarReserva("${reserva.idReserva}")'>
                                Cancelar Reserva
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += reservaCard;
    });
}

// Cancelar reserva
async function cancelarReserva(idReserva) {
    const reservas = JSON.parse(localStorage.getItem('reservas-usuario')) || [];
    const reserva = reservas.find(r => r.idReserva === idReserva);
    
    if (!reserva) return;
    
    // Validar que el vuelo no sea en menos de 24 horas
    const fechaVuelo = new Date(reserva.fechaSalida + 'T' + reserva.horaSalida);
    const ahora = new Date();
    const horasRestantes = (fechaVuelo - ahora) / (1000 * 60 * 60);
    
    if (horasRestantes < 24) {
        Swal.fire({
            icon: 'error',
            title: '⏰ Cancelación No Permitida',
            html: `
                <p>No puedes cancelar esta reserva porque el vuelo sale en menos de 24 horas.</p>
                <p style="color: var(--text-light); margin-top: 10px;">
                    <strong>Tiempo restante:</strong> ${Math.floor(horasRestantes)} hora(s)
                </p>
                <p style="color: var(--text-light);">
                    Por favor, contacta a servicio al cliente para asistencia.
                </p>
            `,
            confirmButtonColor: '#dc3545'
        });
        return;
    }
    
    // Validar que no haya pasado más de 1 semana desde la compra
    const fechaReserva = new Date(reserva.fechaReserva);
    const diasDesdeCompra = (ahora - fechaReserva) / (1000 * 60 * 60 * 24);
    
    if (diasDesdeCompra > 7) {
        Swal.fire({
            icon: 'error',
            title: '📅 Fuera de Plazo',
            html: `
                <p>Ha pasado más de 1 semana desde que realizaste esta reserva.</p>
                <p style="color: var(--text-light);">
                    Solo puedes cancelar dentro de los primeros 7 días.
                </p>
            `,
            confirmButtonColor: '#dc3545'
        });
        return;
    }
    
    const result = await confirmarAccion(
        '¿Cancelar reserva?',
        'Se te reembolsará el 80% del monto pagado. Esta acción no se puede deshacer.',
        'Sí, cancelar'
    );
    
    if (result.isConfirmed) {
        mostrarCargando('Procesando cancelación...', 'Por favor espera');
        
        setTimeout(() => {
            reserva.estado = 'CANCELADA';
            const reembolso = reserva.total * 0.8;
            
            localStorage.setItem('reservas-usuario', JSON.stringify(reservas));
            
            cerrarCargando();
            
            Swal.fire({
                icon: 'success',
                title: 'Reserva Cancelada',
                html: `
                    <p>Tu reserva ha sido cancelada exitosamente.</p>
                    <p><strong>Reembolso:</strong> $${reembolso.toFixed(2)} (80%)</p>
                    <small>El monto será acreditado en 5-7 días hábiles.</small>
                `,
                confirmButtonColor: '#00cc66'
            });
            
            cargarReservasUsuario();
        }, 1500);
    }
}
