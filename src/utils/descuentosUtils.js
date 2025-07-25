import { ajustarPrecio, parsearPrecio } from './preciosUtils';

export const calcularDescuento = (carrito, reglas) => {
  let descuentoTotal = 0;
  
  // Calcular descuento individual por producto
  carrito.forEach(producto => {
    const precioAjustado = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
    const precioBase = parsearPrecio(producto.precio);
    
    // Buscar reglas de descuento por rango de precio
    const reglasRango = reglas.filter(r => r.tipo === 'rango_precio');
    
    // Calcular cuántos productos en el carrito están en el mismo rango de precio
    const productosEnMismoRango = carrito.filter(p => {
      const precioP = ajustarPrecio(p.precio, p.titulo, p.categoria);
      
      // Buscar si ambos productos están en el mismo rango
      for (const regla of reglasRango) {
        const rangoP = regla.rangos.find(r => precioP >= r.min && (r.max === null || precioP <= r.max));
        const rangoActual = regla.rangos.find(r => precioAjustado >= r.min && (r.max === null || precioAjustado <= r.max));
        
        if (rangoP && rangoActual && rangoP === rangoActual) {
          return true;
        }
      }
      return false;
    });
    
    const cantidadEnMismoRango = productosEnMismoRango.reduce((acc, p) => acc + p.cantidad, 0);
    
    const mejorRegla = reglasRango
      .filter(r => cantidadEnMismoRango >= r.minCantidad)
      .sort((a, b) => b.minCantidad - a.minCantidad)[0];
      
    if (mejorRegla) {
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
    }
    
    // Buscar reglas de descuento por ganancia
    const reglasGanancia = reglas.filter(r => r.tipo === 'ganancia');
    const mejorGanancia = reglasGanancia
      .filter(r => cantidadEnMismoRango >= r.minCantidad)
      .sort((a, b) => b.minCantidad - a.minCantidad)[0];
      
    if (mejorGanancia) {
      const ganancia = (precioAjustado - precioBase) * producto.cantidad;
      descuentoTotal += ganancia * (mejorGanancia.porcentaje / 100);
    }
  });
  
  return Math.floor(descuentoTotal);
}; 