// Funciones auxiliares globales
function estaAutenticado() {
    return sessionStorage.getItem('usuario-actual') !== null;
}

function obtenerUsuarioActual() {
    const usuarioJson = sessionStorage.getItem('usuario-actual');
    return usuarioJson ? JSON.parse(usuarioJson) : null;
}

function cerrarSesion() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que deseas salir?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.removeItem('usuario-actual');
            sessionStorage.removeItem('tipo-usuario');
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: 'success',
                title: 'Sesión cerrada exitosamente'
            }).then(() => {
                window.location.href = 'index.html';
            });
        }
    });
}

function formatearMoneda(cantidad) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'USD'
    }).format(cantidad);
}

function formatearFechaHora(fechaHora) {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarTelefono(telefono) {
    const regex = /^809-\d{3}-\d{4}$/;
    return regex.test(telefono);
}

function mostrarNotificacion(mensaje, tipo) {
    tipo = tipo || 'success';
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    Toast.fire({
        icon: tipo,
        title: mensaje
    });
}

function mostrarExito(titulo, mensaje) {
    Swal.fire({
        icon: 'success',
        title: titulo,
        text: mensaje,
        confirmButtonColor: '#00cc66'
    });
}

function mostrarError(titulo, mensaje) {
    Swal.fire({
        icon: 'error',
        title: titulo,
        text: mensaje,
        confirmButtonColor: '#dc3545'
    });
}

function mostrarAdvertencia(titulo, mensaje) {
    Swal.fire({
        icon: 'warning',
        title: titulo,
        text: mensaje,
        confirmButtonColor: '#ffc107'
    });
}

function mostrarInfo(titulo, mensaje) {
    Swal.fire({
        icon: 'info',
        title: titulo,
        text: mensaje,
        confirmButtonColor: '#0066cc'
    });
}

function confirmarAccion(titulo, mensaje, textoConfirmar) {
    textoConfirmar = textoConfirmar || 'Sí, continuar';
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0066cc',
        cancelButtonColor: '#6c757d',
        confirmButtonText: textoConfirmar,
        cancelButtonText: 'Cancelar'
    });
}

function mostrarCargando(titulo, mensaje) {
    titulo = titulo || 'Procesando...';
    mensaje = mensaje || 'Por favor espera';
    Swal.fire({
        title: titulo,
        text: mensaje,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function cerrarCargando() {
    Swal.close();
}

console.log('✅ main.js cargado');
