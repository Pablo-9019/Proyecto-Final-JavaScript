const urlProductos = "./datos/dato.json"
const descuento = 0.20
const precioConDescuento = (precio) => precio * (1 - descuento)

const listaProductos = document.getElementById("productos")
const mensajeCarga = document.getElementById("cargando")
const listaCarrito = document.getElementById("lista")
const panelCarrito = document.querySelector(".carrito")
const busqueda = document.getElementById("busqueda")
const totalCarrito = document.getElementById("total")

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
        notificar("Productos cargados con exito", "#2f5d50")
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "No se pudieron cargar los productos",
            text: "Revisa tu conexion o intenta de nuevo mas tarde.",
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
        notificar("No hay mas stock de este producto", "#b03a2e")
        return
    }
    guardarCarrito()
    notificar("Producto agregado al carrito", "#2f5d50")
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
        notificar("No hay mas stock de este producto", "#b03a2e")
        return
    }
    productoEnCarrito.cantidad = nuevaCantidad
    guardarCarrito()
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter((item) => item.id !== id)
    guardarCarrito()
    notificar("Producto eliminado del carrito", "#b03a2e")
}

function actualizarCarrito() {
    listaCarrito.innerHTML = ""
    let total = 0
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
        total += precioConDescuento(precio) * cantidad
    })
    const totalFormateado = total.toLocaleString("es-AR")
    totalCarrito.textContent = `Total: $${totalFormateado}`
}

function filtrarProductos() {
    const texto = busqueda.value.toLowerCase()
    const tarjetas = listaProductos.querySelectorAll(".box")
    tarjetas.forEach((tarjeta) => {
        const nombre = tarjeta.querySelector("h3").textContent.toLowerCase()
        tarjeta.classList.toggle("oculto", !nombre.includes(texto))
    })
}

document.getElementById("vaciar").addEventListener("click", () => {
    if (carrito.length === 0) {
        notificar("El carrito ya esta vacio", "#b03a2e")
        return
    }
    Swal.fire({
        icon: "warning",
        title: "¿Vaciar el carrito?",
        text: "Se van a quitar todos los productos.",
        showCancelButton: true,
        confirmButtonText: "Si, vaciar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#2f5d50"
    }).then((resultado) => {
        if (resultado.isConfirmed) {
            carrito = []
            guardarCarrito()
            notificar("Carrito vaciado", "#2f5d50")
        }
    })
})

document.getElementById("compra").addEventListener("click", () => {
    if (carrito.length === 0) {
        Swal.fire({
            icon: "error",
            title: "El carrito esta vacio",
            text: "Agrega algun producto antes de comprar.",
            confirmButtonColor: "#2f5d50"
        })
        return
    }
    carrito = []
    guardarCarrito()
    panelCarrito.classList.remove("active")
    Swal.fire({
        icon: "success",
        title: "Compra exitosa",
        text: "Gracias por tu compra",
        confirmButtonColor: "#2f5d50"
    })
})

document.getElementById("ver-carrito").addEventListener("click", () => {
    panelCarrito.classList.add("active")
})
document.querySelector(".cerrar").addEventListener("click", () => {
    panelCarrito.classList.remove("active")
})
busqueda.addEventListener("input", filtrarProductos)

cargarProductos()