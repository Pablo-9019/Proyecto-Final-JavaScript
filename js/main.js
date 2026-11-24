const urlProductos = "./datos/dato.json"
const descuento = 0.20
const precioConDescuento = (precio) => precio * (1 - descuento)

const listaProductos = document.getElementById("productos")
const mensajeCarga = document.getElementById("cargando")
const listaCarrito = document.getElementById("lista")
const panelCarrito = document.querySelector(".carrito")
const busqueda = document.getElementById("busqueda")
const totalCarrito = document.getElementById("total")
const contadorCarrito = document.getElementById("contador")
const costoEnvio = 1500
const seccionCheckout = document.getElementById("checkout")
const listaResumen = document.getElementById("resumen")
const envioDetalle = document.getElementById("envio-detalle")
const totalCheckout = document.getElementById("total-checkout")
const formCompra = document.getElementById("form-compra")
const campoDireccion = document.getElementById("campo-direccion")
const errorForm = document.getElementById("error-form")


let productos = []
let carrito = JSON.parse(localStorage.getItem("carrito")) ?? []

function notificar(texto, color) {
    Toastify({
        text: texto,
        duration: 2500,
        gravity: "bottom",
        position: "right",
        style: { background: color }
    }).showToast()
}

async function cargarProductos() {
    mensajeCarga.classList.remove("oculto")
    try {
        const respuesta = await fetch(urlProductos)
        if (!respuesta.ok) {
            throw new Error("Respuesta no exitosa del servidor")
        }
        productos = await respuesta.json()
        renderizarProductos()
        actualizarCarrito()
        notificar("Productos cargados con éxito", "#2f5d50")
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "No se pudieron cargar los productos",
            text: "Revisa tu conexion o intenta de nuevo más tarde.",
            confirmButtonColor: "#2f5d50"
        })
    } finally {
        mensajeCarga.classList.add("oculto")
    }
}

function renderizarProductos() {
    listaProductos.innerHTML = ""
    productos.forEach(({ id, nombre, categoria, precio, stock, imagen }) => {
        const precioOriginal = precio.toLocaleString("es-AR")
        const precioFinal = precioConDescuento(precio).toLocaleString("es-AR")
        const textoBoton = stock === 0 ? "Sin stock" : "+ Agregar al carrito"

        const tarjeta = document.createElement("article")
        tarjeta.className = "box"
        tarjeta.innerHTML = `
        <img src="${imagen}" alt="${nombre}" class="foto-producto">
        <h3>${nombre}</h3>
        <p class="categoria">Categoría: ${categoria}</p>
        <p class="precio">
            <span class="precio-original">$${precioOriginal}</span>
            <span class="precio-descuento">$${precioFinal}</span>
            <span class="etiqueta-descuento">20% OFF</span>
        </p>
        <p>Disponible: ${stock}</p>
        <button type="button" class="btn" id="agregar-${id}">${textoBoton}</button>`
        listaProductos.appendChild(tarjeta)

        const boton = document.getElementById(`agregar-${id}`)
        boton.disabled = stock === 0
        boton.addEventListener("click", () => {
            agregarAlCarrito(id)
        })
    })
}

function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito))
    actualizarCarrito()
}

function buscarProducto(id) {
    return productos.find((item) => item.id === id)
}

function buscarEnCarrito(id) {
    return carrito.find((item) => item.id === id)
}

function agregarAlCarrito(id) {
    const producto = buscarProducto(id)
    const productoEnCarrito = buscarEnCarrito(id)

    if (productoEnCarrito === undefined) {
        carrito.push({ id: id, cantidad: 1 })
    } else if (productoEnCarrito.cantidad < producto.stock) {
        productoEnCarrito.cantidad++
    } else {
        notificar("No hay más stock de este producto", "#b03a2e")
        return
    }
    guardarCarrito()
    notificar(`${producto.nombre} agregado al carrito `, "#2f5d50")
}

function cambiarCantidad(id, cambio) {
    const producto = buscarProducto(id)
    const productoEnCarrito = buscarEnCarrito(id)
    const nuevaCantidad = productoEnCarrito.cantidad + cambio

    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(id)
        return
    }
    if (nuevaCantidad > producto.stock) {
        notificar("No hay más stock de este producto", "#b03a2e")
        return
    }
    productoEnCarrito.cantidad = nuevaCantidad
    guardarCarrito()
}

function calcularTotal() {
    return carrito.reduce((acumulado, { id, cantidad }) => {
        const producto = buscarProducto(id)
        return producto === undefined ? acumulado : acumulado + precioConDescuento(producto.precio) * cantidad
    }, 0)
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter((item) => item.id !== id)
    guardarCarrito()
    notificar("Producto eliminado del carrito", "#b03a2e")
}
function vaciarCarrito() {
    carrito = []
    localStorage.removeItem("carrito")
    actualizarCarrito()
}


function actualizarCarrito() {
    listaCarrito.innerHTML = ""
    carrito.forEach(({ id, cantidad }) => {
        const producto = buscarProducto(id)
        if (producto === undefined) {
            return
        }
        const { nombre, precio, imagen } = producto
        const precioOriginal = precio.toLocaleString("es-AR")
        const precioFinal = precioConDescuento(precio).toLocaleString("es-AR")

        const elemento = document.createElement("li")
        elemento.innerHTML = `
        <img src="${imagen}" alt="${nombre}" class="foto-producto">
        <span>${nombre} - <del>$${precioOriginal}</del> $${precioFinal}</span>
        <div class="controles-cantidad">
            <button type="button" class="btn-restar">-</button>
            <span>${cantidad}</span>
            <button type="button" class="btn-sumar">+</button>
        </div>
        <button type="button" class="btn-eliminar">Eliminar</button>`

        elemento.querySelector(".btn-restar").addEventListener("click", () => {
            cambiarCantidad(id, -1)
        })
        elemento.querySelector(".btn-sumar").addEventListener("click", () => {
            cambiarCantidad(id, 1)
        })
        elemento.querySelector(".btn-eliminar").addEventListener("click", () => {
            eliminarDelCarrito(id)
        })
        listaCarrito.appendChild(elemento)
    })
const totalFormateado = calcularTotal().toLocaleString("es-AR")
    totalCarrito.textContent = carrito.length === 0 ? "Tu carrito está vacío" : `Total: $${totalFormateado}`
    contadorCarrito.textContent = carrito.reduce((suma, item) => suma + item.cantidad, 0)
}

function filtrarProductos() {
    const texto = busqueda.value.toLowerCase()
    const tarjetas = listaProductos.querySelectorAll(".box")
    tarjetas.forEach((tarjeta) => {
        const nombre = tarjeta.querySelector("h3").textContent.toLowerCase()
        tarjeta.classList.toggle("oculto", !nombre.includes(texto))
    })
}

function obtenerEntrega() {
    return formCompra.querySelector("input[name='entrega']:checked").value
}
 
function obtenerPago() {
    return formCompra.querySelector("input[name='pago']:checked").value
}
 
function calcularTotalConEnvio() {
    const envio = obtenerEntrega() === "envio" ? costoEnvio : 0
    return calcularTotal() + envio
}
 
function mostrarResumen() {
    listaResumen.innerHTML = ""
    carrito.forEach(({ id, cantidad }) => {
        const { nombre, precio } = buscarProducto(id)
        const subtotal = (precioConDescuento(precio) * cantidad).toLocaleString("es-AR")
        const elemento = document.createElement("li")
        elemento.textContent = `${cantidad} x ${nombre} - $${subtotal}`
        listaResumen.appendChild(elemento)
    })
    const esEnvio = obtenerEntrega() === "envio"
    envioDetalle.textContent = esEnvio ? `Envío: $${costoEnvio}` : "Retiro en el local: sin costo"
    campoDireccion.classList.toggle("oculto", !esEnvio)
    totalCheckout.textContent = `Total a pagar: $${calcularTotalConEnvio().toLocaleString("es-AR")}`
}
 
function abrirCheckout() {
    errorForm.textContent = ""
    mostrarResumen()
    panelCarrito.classList.remove("active")
    seccionCheckout.classList.remove("oculto")
}
 
function cerrarCheckout() {
    seccionCheckout.classList.add("oculto")
}
 
function validarFormulario(nombre, telefono, direccion) {
    if (nombre === "") {
        return "Ingresá tu nombre y apellido."
    }
    if (telefono.length < 8 || isNaN(telefono)) {
        return "Ingresá un teléfono válido (solo números)."
    }
    if (obtenerEntrega() === "envio" && direccion === "") {
        return "Ingresá la dirección para el envío."
    }
    return ""
}
 
function confirmarPedido(evento) {
    evento.preventDefault()
    const nombre = document.getElementById("nombre").value.trim()
    const telefono = document.getElementById("telefono").value.trim()
    const direccion = document.getElementById("direccion").value.trim()
    const notas = document.getElementById("notas").value.trim() || "Sin aclaraciones"
 
    const error = validarFormulario(nombre, telefono, direccion)
    errorForm.textContent = error
    if (error !== "") {
        return
    }
 
    const total = calcularTotalConEnvio().toLocaleString("es-AR")
    const pago = obtenerPago()
    const textoEntrega = obtenerEntrega() === "envio" ? `Lo enviamos a ${direccion}.` : "Lo retirás en el local."
 
    Swal.fire({
        icon: "question",
        title: "¿Confirmás tu pedido?",
        text: `Total: $${total} - Pago: ${pago}`,
        showCancelButton: true,
        confirmButtonText: "Sí, confirmar",
        cancelButtonText: "Revisar",
        confirmButtonColor: "#2f5d50"
    }).then((resultado) => {
        if (resultado.isConfirmed) {
            const numeroPedido = Math.floor(Math.random() * 9000) + 1000
            vaciarCarrito()
            formCompra.reset()
            cerrarCheckout()
            Swal.fire({
                icon: "success",
                title: `¡Gracias, ${nombre}!`,
                html: `Pedido N° ${numeroPedido}<br>Total: $${total} (${pago})<br>${textoEntrega}<br>Aclaraciones: ${notas}`,
                confirmButtonColor: "#2f5d50"
            })
        }
    })
}

document.getElementById("vaciar").addEventListener("click", () => {
    if (carrito.length === 0) {
        notificar("El carrito ya está vacío", "#b03a2e")
        return
    }

    Swal.fire({
        icon: "warning",
        title: "¿Vaciar el carrito?",
        text: "Se van a quitar todos los productos.",
        showCancelButton: true,
        confirmButtonText: "Sí, vaciar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#2f5d50"
    }).then((resultado) => {
        if (resultado.isConfirmed) {
            carrito = []
            notificar("Carrito vaciado", "#2f5d50")
        }
    })
})

document.getElementById("compra").addEventListener("click", () => {
    if (carrito.length === 0) {
        Swal.fire({
            icon: "error",
            title: "El carrito está vacío",
            text: "Agregá algún producto antes de comprar.",
            confirmButtonColor: "#2f5d50"
        })
        return
    }
   
    })

document.getElementById("ver-carrito").addEventListener("click", () => {
    panelCarrito.classList.add("active")
})
document.querySelector(".cerrar").addEventListener("click", () => {
  abrirCheckout()
})
busqueda.addEventListener("input", filtrarProductos)

cargarProductos()

document.getElementById("volver").addEventListener("click", () => {
    cerrarCheckout()
    panelCarrito.classList.add("active")
})
formCompra.querySelectorAll("input[name='entrega']").forEach((opcion) => {
    opcion.addEventListener("change", mostrarResumen)
})
formCompra.addEventListener("submit", confirmarPedido)
