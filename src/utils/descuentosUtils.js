import { ajustarPrecio, parsearPrecio } from './preciosUtils';

export const calcularDescuento = (carrito, reglas) => {
  let descuentoTotal = 0;
  // Buscar la mejor regla de rango_precio según la cantidad de productos
  const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  const reglasRango = reglas.filter(r => r.tipo === 'rango_precio');
  // Ordenar de mayor a menor minCantidad y tomar la mejor que cumpla
  const mejorRegla = reglasRango
    .filter(r => cantidadTotal >= r.minCantidad)
    .sort((a, b) => b.minCantidad - a.minCantidad)[0];
  if (mejorRegla) {
    carrito.forEach(producto => {
      const precioAjustado = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
      const precioBase = parsearPrecio(producto.precio);
      const rango = mejorRegla.rangos.find(r => precioAjustado >= r.min && (r.max === null || precioAjustado <= r.max));
      if (rango) {
        if (rango.esPorcentaje) {
          descuentoTotal += (precioAjustado * producto.cantidad) * (rango.descuento / 100);
        } else if (rango.sobreGanancia) {
          const ganancia = (precioAjustado - precioBase) * producto.cantidad;
          descuentoTotal += ganancia * (rango.descuento / 100);
        } else {
          descuentoTotal += rango.descuento * producto.cantidad;
        }
      }
    });
  }
  // Descuento sobre ganancia acumulada (regla global, si existe)
  const reglasGanancia = reglas.filter(r => r.tipo === 'ganancia');
  const mejorGanancia = reglasGanancia
    .filter(r => cantidadTotal >= r.minCantidad)
    .sort((a, b) => b.minCantidad - a.minCantidad)[0];
  if (mejorGanancia) {
    let gananciaTotal = 0;
    carrito.forEach(producto => {
      const precioAjustado = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
      const precioBase = parsearPrecio(producto.precio);
      gananciaTotal += (precioAjustado - precioBase) * producto.cantidad;
    });
    descuentoTotal += gananciaTotal * (mejorGanancia.porcentaje / 100);
  }
  return Math.floor(descuentoTotal);
}; 