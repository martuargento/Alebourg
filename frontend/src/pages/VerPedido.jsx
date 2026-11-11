import { useEffect, useRef } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
import jsPDF from 'jspdf';
import { useCarritoStore } from '../store/carritoStore';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../api/analytics';
import { obtenerPrecioFinal, formatearPrecio, parsearPrecio } from '../utils/preciosUtils';
import { usePreciosConfig } from '../hooks/useConfiguracion';

const numeroWhatsApp = '5491133328382';

function generarPdfPedido(productos, total) {
  const documento = new jsPDF();
  const fecha = new Date();
  let posicionY = 20;

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(20);
  documento.text('Alebourg - Pedido', 105, posicionY, { align: 'center' });
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(11);
  documento.text(`Fecha: ${fecha.toLocaleDateString('es-AR')}`, 20, 32);
  documento.text(`Hora: ${fecha.toLocaleTimeString('es-AR')}`, 20, 39);
  posicionY = 52;
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(13);
  documento.text('Productos', 20, posicionY);
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(10);

  productos.forEach(({ producto, precio, subtotal }, index) => {
    posicionY += 12;
    if (posicionY > 265) {
      documento.addPage();
      posicionY = 20;
    }

    const nombre = documento.splitTextToSize(`${index + 1}. ${producto.titulo}`, 150);
    documento.text(nombre, 20, posicionY);
    posicionY += nombre.length * 5;
    documento.text(
      `${producto.cantidad} x $${formatearPrecio(precio)} = $${formatearPrecio(subtotal)}`,
      25,
      posicionY,
    );
  });

  posicionY += 15;
  if (posicionY > 265) {
    documento.addPage();
    posicionY = 20;
  }
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(12);
  documento.text(`Total a pagar: $${formatearPrecio(total)}`, 20, posicionY);
  documento.save(`pedido_alebourg_${fecha.toISOString().slice(0, 10)}_${Date.now()}.pdf`);
}

function crearMensajePedido(productos, total) {
  const lineas = productos.map(({ producto, precio, subtotal }) => (
    `- ${producto.titulo}: ${producto.cantidad} x $${formatearPrecio(precio)} = $${formatearPrecio(subtotal)}`
  ));
  lineas.push('', `Total a pagar: $${formatearPrecio(total)}`);
  lineas.push('', 'Se generó un PDF con el detalle del pedido para adjuntar.');
  return `Alebourg, quiero realizar el siguiente pedido:\n\n${lineas.join('\n')}`;
}

export default function VerPedido() {
  const {
    carrito,
    aumentarCantidad,
    disminuirCantidad,
    eliminarDelCarrito,
    vaciarCarrito,
  } = useCarritoStore();
  const { isAdmin } = useAuth();
  const { data: configuracionPrecios } = usePreciosConfig();
  const carritoAlAbrir = useRef(carrito);

  useEffect(() => {
    trackEvent('view_cart', {
      items: carritoAlAbrir.current.map(({ id, cantidad }) => ({ id, qty: cantidad })),
    }).catch((error) => console.error('No se pudo registrar la vista del carrito:', error));
  }, []);

  const lineas = carrito.map((producto) => {
    const precio = obtenerPrecioFinal(producto, configuracionPrecios);
    return { producto, precio, subtotal: precio * producto.cantidad };
  });
  const total = lineas.reduce((suma, linea) => suma + linea.subtotal, 0);
  const ganancia = carrito.reduce((suma, producto) => (
    suma + Math.max(
      0,
      obtenerPrecioFinal(producto, configuracionPrecios)
      - parsearPrecio(producto.precio),
    ) * producto.cantidad
  ), 0);

  const realizarPedido = () => {
    generarPdfPedido(lineas, total);
    const mensaje = crearMensajePedido(lineas, total);
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
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
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {lineas.map(({ producto, precio, subtotal }) => (
          <div key={producto.id} className="mb-4 cart-item" style={{ borderRadius: 8, padding: 20 }}>
            <Row className="align-items-center">
              <Col xs={12} md={6}>
                <div className="mb-2" style={{ fontSize: '1.1rem' }}>{producto.titulo}</div>
                <div className="opacity-75">${formatearPrecio(precio)} c/u</div>
              </Col>
              <Col xs={12} md={3} className="my-3 my-md-0 d-flex justify-content-center">
                <div className="d-flex align-items-center">
                  <Button
                    variant="link"
                    className="cart-quantity-button p-0"
                    aria-label="Disminuir cantidad"
                    onClick={() => disminuirCantidad(producto.id)}
                  >
                    -
                  </Button>
                  <span className="mx-3 fw-medium">{producto.cantidad}</span>
                  <Button
                    variant="link"
                    className="cart-quantity-button p-0"
                    aria-label="Aumentar cantidad"
                    onClick={() => aumentarCantidad(producto.id)}
                  >
                    +
                  </Button>
                  <Button
                    variant="link"
                    className="cart-quantity-button p-0 ms-3"
                    aria-label="Eliminar producto"
                    onClick={() => eliminarDelCarrito(producto.id)}
                  >
                    <FaTrash size={14} />
                  </Button>
                </div>
              </Col>
              <Col xs={12} md={3} className="text-md-end text-center">
                <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>
                  ${formatearPrecio(subtotal)}
                </div>
              </Col>
            </Row>
          </div>
        ))}

        <div className="mt-4 mb-4 p-3 cart-total" style={{ borderRadius: 8 }}>
          <Row className="align-items-center mt-3">
            <Col><span className="h4 fw-bold">Total a pagar:</span></Col>
            <Col className="text-end">
              <span className="h3 fw-bold text-success">${formatearPrecio(total)}</span>
            </Col>
          </Row>
          {isAdmin && (
            <div className="ganancia-box mt-3 p-3">
              <div>Ganancia bruta: ${formatearPrecio(ganancia)}</div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4">
          <Button className="cart-button px-4 py-2" onClick={vaciarCarrito}>
            Vaciar carrito
          </Button>
          <Button
            className="cart-button px-4 py-2"
            style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
            onClick={realizarPedido}
          >
            Realizar Pedido
          </Button>
        </div>
      </div>
    </Container>
  );
}
