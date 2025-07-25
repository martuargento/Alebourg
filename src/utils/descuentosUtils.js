import { ajustarPrecio } from './preciosUtils';

export const calcularDescuento = (carrito, reglas) => {
  let descuentoTotal = 0;
  // Reglas por cantidad total
  const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  reglas.filter(r => r.tipo === 'cantidad').forEach(regla => {
    if (cantidadTotal >= regla.minCantidad) {
      const subtotal = carrito.reduce((acc, p) => acc + ajustarPrecio(p.precio, p.titulo, p.categoria) * p.cantidad, 0);
      if (regla.esPorcentaje) {
        descuentoTotal = Math.max(descuentoTotal, subtotal * (regla.descuento / 100));
      } else {
        descuentoTotal = Math.max(descuentoTotal, regla.descuento);
      }
    }
  });
  // Reglas por producto específico
  carrito.forEach(producto => {
    reglas.filter(r => r.tipo === 'producto' && r.productoId === producto.id).forEach(regla => {
      if (producto.cantidad >= regla.minCantidad) {
        const precioAjustado = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
        if (regla.esPorcentaje) {
          descuentoTotal += (precioAjustado * producto.cantidad) * (regla.descuento / 100);
        } else {
          descuentoTotal += regla.descuento * producto.cantidad;
        }
      }
    });
  });
  return Math.floor(descuentoTotal);
}; 