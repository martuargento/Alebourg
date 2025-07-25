import React, { useEffect, useState } from 'react';
import { usarCarrito } from '../context/CarritoContexto';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { ajustarPrecio, formatearPrecio } from '../utils/preciosUtils';
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

  useEffect(() => {
    setDescuento(calcularDescuento(carrito, reglasDescuento));
  }, [carrito, reglasDescuento]);

  const totalConDescuento = Math.max(0, total - descuento);

  // Incentivo de descuentos
  let mensajeDescuento = '';
  const reglasCantidad = reglasDescuento.filter(r => r.tipo === 'cantidad').sort((a, b) => a.minCantidad - b.minCantidad);
  if (reglasCantidad.length > 0) {
    const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0);
    let descuentoActual = null;
    let proximoDescuento = null;
    for (let i = 0; i < reglasCantidad.length; i++) {
      if (cantidadTotal >= reglasCantidad[i].minCantidad) {
        descuentoActual = reglasCantidad[i];
      } else if (!proximoDescuento) {
        proximoDescuento = reglasCantidad[i];
      }
    }
    if (proximoDescuento) {
      const faltan = proximoDescuento.minCantidad - cantidadTotal;
      mensajeDescuento = `¡Agregá ${faltan} producto${faltan > 1 ? 's' : ''} más y obtené ${proximoDescuento.descuento}${proximoDescuento.esPorcentaje ? '% de descuento' : '$ de descuento'}!`;
    } else if (descuentoActual) {
      mensajeDescuento = `¡Ya tenés un descuento de ${descuentoActual.descuento}${descuentoActual.esPorcentaje ? '%': '$'} por cantidad!`;
    }
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
          <Row className="align-items-center">
            <Col>
              <span className="h5 mb-0">Total:</span>
            </Col>
            <Col className="text-end">
              <span className="h4 mb-0" style={{ fontWeight: '600' }}>
                ${formatearPrecio(total)}
              </span>
            </Col>
          </Row>
          {descuento > 0 && (
            <Row className="align-items-center mt-2">
              <Col>
                <span className="h6 mb-0 text-success">Descuento aplicado:</span>
              </Col>
              <Col className="text-end">
                <span className="h5 mb-0 text-success">- ${formatearPrecio(descuento)}</span>
              </Col>
            </Row>
          )}
          {descuento > 0 && (
            <Row className="align-items-center mt-1">
              <Col>
                <span className="h6 mb-0">Total con descuento:</span>
              </Col>
              <Col className="text-end">
                <span className="h4 mb-0" style={{ fontWeight: '700', color: '#00ff44' }}>
                  ${formatearPrecio(totalConDescuento)}
                </span>
              </Col>
            </Row>
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
