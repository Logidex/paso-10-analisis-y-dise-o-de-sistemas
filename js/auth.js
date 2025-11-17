// Variable para controlar el tipo de usuario (cliente o agente)
let tipoUsuario = 'cliente';

// Constantes para control de intentos de login
const MAX_INTENTOS_LOGIN = 3;
const TIEMPO_BLOQUEO = 5 * 60 * 1000; // 5 minutos en milisegundos

// Cambiar entre tabs de cliente y agente
function cambiarTab(tipo) {
    tipoUsuario = tipo;
    
    const tabCliente = document.getElementById('tab-cliente');
    const tabAgente = document.getElementById('tab-agente');
    
    if (tipo === 'cliente') {
        tabCliente.classList.remove('btn-outline');
        tabCliente.classList.add('btn-primary');
        tabAgente.classList.remove('btn-primary');
        tabAgente.classList.add('btn-outline');
    } else {
        tabAgente.classList.remove('btn-outline');
        tabAgente.classList.add('btn-primary');
        tabCliente.classList.remove('btn-primary');
        tabCliente.classList.add('btn-outline');
    }
}

// Inicializar el tab de cliente por defecto al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tab-cliente')) {
        cambiarTab('cliente');
    }
});

// Función para verificar si la cuenta está bloqueada
function cuentaBloqueada(email) {
    const bloqueosStr = localStorage.getItem('cuentas-bloqueadas');
    if (!bloqueosStr) return false;
    
    const bloqueos = JSON.parse(bloqueosStr);
    const bloqueo = bloqueos[email];
    
    if (!bloqueo) return false;
    
    // Verificar si el tiempo de bloqueo ya pasó
    if (Date.now() - bloqueo.timestamp > TIEMPO_BLOQUEO) {
        // Desbloquear cuenta
        delete bloqueos[email];
        localStorage.setItem('cuentas-bloqueadas', JSON.stringify(bloqueos));
        return false;
    }
    
    return true;
}

// Función para registrar intento fallido
function registrarIntentoFallido(email) {
    const intentosStr = localStorage.getItem('intentos-login');
    const intentos = intentosStr ? JSON.parse(intentosStr) : {};
    
    if (!intentos[email]) {
        intentos[email] = { count: 1, timestamp: Date.now() };
    } else {
        intentos[email].count++;
        intentos[email].timestamp = Date.now();
    }
    
    localStorage.setItem('intentos-login', JSON.stringify(intentos));
    
    // Si alcanzó el límite, bloquear cuenta
    if (intentos[email].count >= MAX_INTENTOS_LOGIN) {
        const bloqueosStr = localStorage.getItem('cuentas-bloqueadas');
        const bloqueos = bloqueosStr ? JSON.parse(bloqueosStr) : {};
        
        bloqueos[email] = { timestamp: Date.now() };
        localStorage.setItem('cuentas-bloqueadas', JSON.stringify(bloqueos));
        
        return true; // Indica que se bloqueó
    }
    
    return false; // No se bloqueó aún
}

// Función para limpiar intentos (login exitoso)
function limpiarIntentosLogin(email) {
    const intentosStr = localStorage.getItem('intentos-login');
    if (!intentosStr) return;
    
    const intentos = JSON.parse(intentosStr);
    if (intentos[email]) {
        delete intentos[email];
        localStorage.setItem('intentos-login', JSON.stringify(intentos));
    }
}

// Función para iniciar sesión
async function iniciarSesion(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validar campos
    if (!email || !password) {
        mostrarError('Campos vacíos', 'Por favor completa todos los campos.');
        return;
    }
    
    // Mostrar loader
    mostrarCargando('Iniciando sesión...', 'Por favor espera');
    
    try {
        if (tipoUsuario === 'cliente') {
            await loginCliente(email, password);
        } else {
            await loginAgente(email, password);
        }
    } catch (error) {
        cerrarCargando();
        mostrarError('Error', error.message);
    }
}

// Login de cliente
async function loginCliente(email, password) {
    // Verificar si la cuenta está bloqueada
    if (cuentaBloqueada(email)) {
        const bloqueosStr = localStorage.getItem('cuentas-bloqueadas');
        const bloqueos = JSON.parse(bloqueosStr);
        const tiempoRestante = Math.ceil((TIEMPO_BLOQUEO - (Date.now() - bloqueos[email].timestamp)) / 60000);
        
        cerrarCargando();
        Swal.fire({
            icon: 'error',
            title: '🔒 Cuenta Bloqueada',
            html: `
                <p>Has excedido el número de intentos permitidos.</p>
                <p><strong>Tu cuenta estará bloqueada por ${tiempoRestante} minuto(s).</strong></p>
                <p style="color: var(--text-light); margin-top: 10px;">
                    Por seguridad, espera antes de intentar de nuevo.
                </p>
            `,
            confirmButtonColor: '#dc3545'
        });
        return;
    }
    
    const response = await fetch('./data/usuarios.json');
    const data = await response.json();
    
    // Cargar usuarios adicionales de localStorage
    const usuariosLocalStorage = JSON.parse(localStorage.getItem('usuarios-registrados')) || [];
    
    // Combinar ambos arrays
    const todosLosUsuarios = [...data.usuarios, ...usuariosLocalStorage];
    
    const usuario = todosLosUsuarios.find(u => u.correo === email && u.password === password);
    
    setTimeout(() => {
        cerrarCargando();
        
        if (usuario) {
            // Login exitoso - limpiar intentos
            limpiarIntentosLogin(email);
            
            // Guardar usuario en sessionStorage
            sessionStorage.setItem('usuario-actual', JSON.stringify(usuario));
            sessionStorage.setItem('tipo-usuario', 'cliente');
            
            mostrarExito('¡Bienvenido!', `Hola ${usuario.nombreCompleto}`);
            
            setTimeout(() => {
                window.location.href = 'panel-cliente.html';
            }, 1500);
        } else {
            // Login fallido - registrar intento
            const bloqueado = registrarIntentoFallido(email);
            
            if (bloqueado) {
                Swal.fire({
                    icon: 'error',
                    title: '🔒 Cuenta Bloqueada',
                    html: `
                        <p>Has excedido el número de intentos permitidos.</p>
                        <p><strong>Tu cuenta ha sido bloqueada por 5 minutos.</strong></p>
                    `,
                    confirmButtonColor: '#dc3545'
                });
            } else {
                const intentosStr = localStorage.getItem('intentos-login');
                const intentos = JSON.parse(intentosStr);
                const intentosRestantes = MAX_INTENTOS_LOGIN - intentos[email].count;
                
                Swal.fire({
                    icon: 'error',
                    title: 'Credenciales incorrectas',
                    html: `
                        <p>El correo o la contraseña son incorrectos.</p>
                        <p style="color: var(--warning-color); font-weight: 600;">
                            ⚠️ Intentos restantes: ${intentosRestantes}
                        </p>
                    `,
                    confirmButtonColor: '#dc3545'
                });
            }
        }
    }, 1000);
}

// Login de agente
async function loginAgente(email, password) {
    const response = await fetch('./data/agentes.json');
    const data = await response.json();
    
    const agente = data.agentes.find(a => a.correo === email && a.password === password);
    
    setTimeout(() => {
        cerrarCargando();
        
        if (agente) {
            // Guardar agente en sessionStorage
            sessionStorage.setItem('usuario-actual', JSON.stringify(agente));
            sessionStorage.setItem('tipo-usuario', 'agente');
            
            mostrarExito('¡Bienvenido!', `Hola ${agente.nombre}`);
            
            setTimeout(() => {
                window.location.href = 'panel-agente.html';
            }, 1500);
        } else {
            mostrarError('Credenciales incorrectas', 'El correo o la contraseña son incorrectos.');
        }
    }, 1000);
}

// Mostrar/ocultar campo de compañía según tipo de cliente
function toggleCompania() {
    const tipoCliente = document.getElementById('tipo-cliente').value;
    const grupoCompania = document.getElementById('grupo-compania');
    const inputCompania = document.getElementById('compania');
    
    if (tipoCliente === 'CORPORATIVO') {
        grupoCompania.classList.remove('hidden');
        inputCompania.required = true;
    } else {
        grupoCompania.classList.add('hidden');
        inputCompania.required = false;
        inputCompania.value = '';
    }
}

// Función para registrar nuevo cliente
async function registrarCliente(event) {
    event.preventDefault();
    
    // Obtener datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email-registro').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const tipoCliente = document.getElementById('tipo-cliente').value;
    const compania = document.getElementById('compania').value.trim();
    const password = document.getElementById('password-registro').value;
    const passwordConfirmar = document.getElementById('password-confirmar').value;
    
    // Validaciones
    if (!nombre || !email || !telefono || !direccion || !tipoCliente || !password || !passwordConfirmar) {
        mostrarError('Campos incompletos', 'Por favor completa todos los campos requeridos.');
        return;
    }
    
    if (!validarEmail(email)) {
        mostrarError('Email inválido', 'Por favor ingresa un correo electrónico válido.');
        return;
    }
    
    if (!validarTelefono(telefono)) {
        mostrarError('Teléfono inválido', 'El formato debe ser: 809-XXX-XXXX');
        return;
    }
    
    if (tipoCliente === 'CORPORATIVO' && !compania) {
        mostrarError('Falta nombre de empresa', 'Los clientes corporativos deben ingresar el nombre de su empresa.');
        return;
    }
    
    if (password !== passwordConfirmar) {
        mostrarError('Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales.');
        return;
    }
    
    if (password.length < 6) {
        mostrarError('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    
    // Mostrar loader
    mostrarCargando('Creando cuenta...', 'Por favor espera');
    
    try {
        // Cargar usuarios del archivo JSON
        const response = await fetch('./data/usuarios.json');
        const data = await response.json();
        
        // Cargar usuarios de localStorage
        const usuariosLocalStorage = JSON.parse(localStorage.getItem('usuarios-registrados')) || [];
        
        // Combinar todos los usuarios
        const todosLosUsuarios = [...data.usuarios, ...usuariosLocalStorage];
        
        // Verificar si el email ya existe
        const emailExiste = todosLosUsuarios.find(u => u.correo === email);
        
        setTimeout(() => {
            cerrarCargando();
            
            if (emailExiste) {
                mostrarError('Email ya registrado', 'Este correo electrónico ya está en uso. Por favor usa otro.');
                return;
            }
            
            // Crear nuevo usuario
            const nuevoUsuario = {
                idCliente: Date.now(), // ID único basado en timestamp
                nombreCompleto: nombre,
                correo: email,
                telefono: telefono,
                direccion: direccion,
                compania: tipoCliente === 'CORPORATIVO' ? compania : null,
                tipoCliente: tipoCliente,
                estadoCuenta: 'ACTIVA',
                saldoMillas: tipoCliente === 'CORPORATIVO' ? 500 : 0, // Bonus para corporativos
                password: password
            };
            
            // Guardar en localStorage
            usuariosLocalStorage.push(nuevoUsuario);
            localStorage.setItem('usuarios-registrados', JSON.stringify(usuariosLocalStorage));
            
            // Mostrar éxito
            Swal.fire({
                icon: 'success',
                title: '¡Cuenta creada exitosamente!',
                html: `
                    <p>Bienvenido <strong>${nombre}</strong></p>
                    <p>Tu cuenta ha sido creada correctamente.</p>
                    ${tipoCliente === 'CORPORATIVO' ? `<p>🎁 <strong>Has recibido 500 millas de bienvenida!</strong></p>` : ''}
                    <p style="margin-top: 15px; color: #666; font-size: 0.9rem;">
                        📧 Tus credenciales:<br>
                        <strong>${email}</strong>
                    </p>
                `,
                confirmButtonColor: '#00cc66',
                confirmButtonText: 'Ir a Iniciar Sesión'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'login.html';
                }
            });
            
        }, 1500);
        
    } catch (error) {
        cerrarCargando();
        mostrarError('Error al registrar', 'Hubo un problema al crear la cuenta. Por favor intenta de nuevo.');
        console.error(error);
    }
}
