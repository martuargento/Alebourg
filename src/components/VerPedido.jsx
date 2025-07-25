import React, { useEffect, useState } from 'react';
import { usarCarrito } from '../context/CarritoContexto';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { ajustarPrecio, formatearPrecio, parsearPrecio } from '../utils/preciosUtils';
import { calcularDescuento } from '../utils/descuentosUtils';
import { FaTrash } from 'react-icons/fa';

const VerPedido = () => {
  const { 
    carrito, 
    aumentarCantidad, 
    disminuirCantidad, 
    eliminarDelCarrito,
    vaciarCarrito 
  } = usarCarrito();

  const [reglasDescuento, setReglasDescuento] = useState([]);
  const [descuento, setDescuento] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3001/api/descuentos')
      .then(res => res.json())
      .then(setReglasDescuento)
      .catch(() => setReglasDescuento([]));
  }, []);

  // Calcular el total del carrito
  const total = carrito.reduce((acc, producto) => {
    const precioNumerico = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
    return acc + (precioNumerico * producto.cantidad);
  }, 0);

  // Calcular la ganancia total
  const gananciaTotal = carrito.reduce((acc, producto) => {
    const precioAjustado = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
    const precioBase = parsearPrecio(producto.precio);
    return acc + ((precioAjustado - precioBase) * producto.cantidad);
  }, 0);

  useEffect(() => {
    setDescuento(calcularDescuento(carrito, reglasDescuento));
  }, [carrito, reglasDescuento]);

  const totalConDescuento = Math.max(0, total - descuento);

  // Calcular la ganancia neta después del descuento
  const gananciaNeta = gananciaTotal - descuento;

  // Incentivo de descuentos para rango_precio múltiple
  let mensajeDescuento = '';
  const reglasRango = reglasDescuento.filter(r => r.tipo === 'rango_precio');
  const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  // Buscar el próximo escalón
  const proximaRegla = reglasRango
    .filter(r => r.minCantidad > cantidadTotal)
    .sort((a, b) => a.minCantidad - b.minCantidad)[0];
  const mejorRegla = reglasRango
    .filter(r => cantidadTotal >= r.minCantidad)
    .sort((a, b) => b.minCantidad - a.minCantidad)[0];
  if (proximaRegla) {
    const faltan = proximaRegla.minCantidad - cantidadTotal;
    const porcentajes = proximaRegla.rangos.filter(r => r.esPorcentaje && r.descuento > 0).map(r => r.descuento);
    const fijos = proximaRegla.rangos.filter(r => !r.esPorcentaje && r.descuento > 0).map(r => r.descuento);
    let partes = [];
    if (porcentajes.length > 0) {
      const minP = Math.min(...porcentajes);
      const maxP = Math.max(...porcentajes);
      partes.push(minP === maxP ? `${maxP}%` : `entre ${minP}% y ${maxP}%`);
    }
    if (fijos.length > 0) {
      const minF = Math.min(...fijos);
      const maxF = Math.max(...fijos);
      partes.push(minF === maxF ? `$${minF}` : `entre $${minF} y $${maxF}`);
    }
    if (partes.length > 0) {
      mensajeDescuento = `¡Agregá ${faltan} producto${faltan > 1 ? 's' : ''} más y obtené descuentos ${partes.join(' y ')} según el valor de cada producto!`;
    } else {
      mensajeDescuento = `¡Agregá ${faltan} producto${faltan > 1 ? 's' : ''} más y obtené descuentos especiales según el valor de cada producto!`;
    }
  } else if (mejorRegla) {
    mensajeDescuento = `¡Ya tenés descuento por rango de precio aplicado en cada producto!`;
  }

  // Función para enviar pedido por WhatsApp
  const enviarPedidoWhatsApp = () => {
    const numeroWhatsApp = "+5491133328382";
    let mensaje = "Alebourg!, Quiero realizar el siguiente pedido:\n\n";
    
    carrito.forEach(producto => {
      const precioUnitario = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
      const subtotal = precioUnitario * producto.cantidad;
      mensaje += `- ${producto.titulo}: ${producto.cantidad} x $${formatearPrecio(precioUnitario)} = $${formatearPrecio(subtotal)}\n`;
    });
    
    mensaje += `\nTotal: $${formatearPrecio(total)}`;
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
  };

  // Verificar si es admin
  const esAdmin = typeof window !== 'undefined' && localStorage.getItem('esAdmin') === 'true';

  if (carrito.length === 0) {
    return (
      <Container className="my-5">
        <h4 className="text-white text-center">El carrito está vacío</h4>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {mensajeDescuento && (
          <div className="alert alert-info text-center mb-4" style={{ fontSize: '1.1rem' }}>
            {mensajeDescuento}
          </div>
        )}
        {carrito.map(producto => {
          const precioNumerico = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
          const precioUnitario = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
          const subtotal = precioUnitario * producto.cantidad;
          
          // Calcular el descuento total que le corresponde a este producto
          let descuentoTotalProducto = 0;
          let porcentajeDescuento = null;
          let esDescuentoPorGanancia = false;
          
          // Buscar reglas de descuento por rango de precio
          const reglasRango = reglasDescuento.filter(r => r.tipo === 'rango_precio');
          const mejorReglaRango = reglasRango
            .filter(r => carrito.reduce((acc, p) => acc + p.cantidad, 0) >= r.minCantidad)
            .sort((a, b) => b.minCantidad - a.minCantidad)[0];
            
          if (mejorReglaRango) {
            const rango = mejorReglaRango.rangos.find(r => precioUnitario >= r.min && (r.max === null || precioUnitario <= r.max));
            
            if (rango) {
              if (rango.esPorcentaje) {
                descuentoTotalProducto += Math.floor((precioUnitario * producto.cantidad) * (rango.descuento / 100));
                porcentajeDescuento = rango.descuento;
              } else if (rango.sobreGanancia) {
                const gananciaProducto = (precioUnitario - parsearPrecio(producto.precio)) * producto.cantidad;
                descuentoTotalProducto += Math.floor(gananciaProducto * (rango.descuento / 100));
                esDescuentoPorGanancia = true;
              } else {
                descuentoTotalProducto += rango.descuento * producto.cantidad;
              }
            }
          }
          
          // Buscar reglas de descuento por ganancia global
          const reglasGanancia = reglasDescuento.filter(r => r.tipo === 'ganancia');
          const mejorReglaGanancia = reglasGanancia
            .filter(r => carrito.reduce((acc, p) => acc + p.cantidad, 0) >= r.minCantidad)
            .sort((a, b) => b.minCantidad - a.minCantidad)[0];
            
          if (mejorReglaGanancia && gananciaTotal > 0) {
            const gananciaProducto = (precioUnitario - parsearPrecio(producto.precio)) * producto.cantidad;
            const proporcionGanancia = gananciaProducto / gananciaTotal;
            descuentoTotalProducto += Math.floor(gananciaTotal * (mejorReglaGanancia.porcentaje / 100) * proporcionGanancia);
            esDescuentoPorGanancia = true;
          }
          
          let infoDescuento = null;
          if (descuentoTotalProducto > 0) {
            infoDescuento = { 
              monto: descuentoTotalProducto,
              porcentaje: porcentajeDescuento,
              esPorGanancia: esDescuentoPorGanancia
            };
          }
          
          return (
            <div 
              key={producto.id} 
              className="mb-4 cart-item"
              style={{
                borderRadius: '8px',
                padding: '20px'
              }}
            >
              <Row className="align-items-center">
                <Col xs={12} md={6}>
                  <div className="mb-2" style={{ fontSize: '1.1rem' }}>{producto.titulo}</div>
                  <div className="opacity-75" style={{ fontSize: '0.95rem' }}>
                    ${formatearPrecio(precioUnitario)} c/u
                  </div>
                </Col>
                <Col xs={12} md={3} className="my-3 my-md-0 d-flex justify-content-center">
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="link"
                      className="cart-quantity-button p-0"
                      onClick={() => disminuirCantidad(producto.id)}
                    >
                      -
                    </Button>
                    <span className="mx-3 fw-medium">
                      {producto.cantidad}
                    </span>
                    <Button 
                      variant="link"
                      className="cart-quantity-button p-0"
                      onClick={() => aumentarCantidad(producto.id)}
                    >
                      +
                    </Button>
                    <Button 
                      variant="link"
                      className="cart-quantity-button p-0 ms-3"
                      onClick={() => eliminarDelCarrito(producto.id)}
                    >
                      <FaTrash size={14} />
                    </Button>
                  </div>
                </Col>
                <Col xs={12} md={3} className="text-md-end text-center">
                  <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>
                    ${formatearPrecio(subtotal)}
                  </div>
                  {infoDescuento && (
                    <div style={{ fontSize: '0.95rem', color: '#0ea5e9', marginTop: 4 }}>
                      {infoDescuento.porcentaje && !infoDescuento.esPorGanancia ? (
                        <>
                          <div>Descuento: -${formatearPrecio(infoDescuento.monto)}</div>
                          <div style={{ fontSize: '0.85rem', color: '#059669', marginTop: 2 }}>
                            ¡{infoDescuento.porcentaje}% de descuento aplicado!
                          </div>
                        </>
                      ) : (
                        <div>Descuento: -${formatearPrecio(infoDescuento.monto)}</div>
                      )}
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          );
        })}

        <div 
          className="mt-4 mb-4 p-3 cart-total"
          style={{
            borderRadius: '8px'
          }}
        >
          {descuento > 0 ? (
            <>
              <Row className="align-items-center">
                <Col>
                  <span className="h6 mb-0 text-muted">Precio original:</span>
                </Col>
                <Col className="text-end">
                  <span className="h6 mb-0 text-muted" style={{ textDecoration: 'line-through' }}>
                    ${formatearPrecio(total)}
                  </span>
                </Col>
              </Row>
              <Row className="align-items-center mt-2">
                <Col>
                  <span className="h6 mb-0 text-success">Descuento aplicado:</span>
                </Col>
                <Col className="text-end">
                  <span className="h5 mb-0 text-success">- ${formatearPrecio(descuento)}</span>
                </Col>
              </Row>
              <Row className="align-items-center mt-3">
                <Col>
                  <span className="h4 mb-0 fw-bold">Total a pagar:</span>
                </Col>
                <Col className="text-end">
                  <span className="h3 mb-0" style={{ fontWeight: '700', color: '#00ff44' }}>
                    ${formatearPrecio(totalConDescuento)}
                  </span>
                </Col>
              </Row>
            </>
          ) : (
            <Row className="align-items-center">
              <Col>
                <span className="h4 mb-0 fw-bold">Total a pagar:</span>
              </Col>
              <Col className="text-end">
                <span className="h3 mb-0" style={{ fontWeight: '700' }}>
                  ${formatearPrecio(total)}
                </span>
              </Col>
            </Row>
          )}
          {esAdmin && (
            <div className="ganancia-box" style={{ background: 'rgba(0, 188, 212, 0.07)', border: '1.5px solid #00bcd4', borderRadius: 12, padding: 14, margin: '18px 0 0 0', boxShadow: '0 1px 6px rgba(0,180,212,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 15, color: '#0097a7', fontWeight: 600, marginRight: 6, display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0097a7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
                  Resumen de ganancias (solo admin)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 2 }}>
                <span style={{ color: '#ff9800', fontWeight: 500 }}>Ganancia bruta:</span>
                <span style={{ color: '#ff9800', fontWeight: 600 }}>${formatearPrecio(gananciaTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                <span style={{ color: '#009688', fontWeight: 500 }}>Ganancia real después del descuento:</span>
                <span style={{ color: '#009688', fontWeight: 600 }}>${formatearPrecio(gananciaNeta)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4">
          <Button 
            className="cart-button px-4 py-2"
            style={{ 
              minWidth: '140px'
            }}
            onClick={vaciarCarrito}
          >
            Vaciar carrito
          </Button>
          <Button 
            className="cart-button px-4 py-2"
            style={{ 
              minWidth: '140px'
            }}
            onClick={enviarPedidoWhatsApp}
          >
            Enviar pedido
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default VerPedido;
