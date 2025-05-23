import React from 'react';
import { usarCarrito } from '../context/CarritoContexto';
import { Container, ListGroup, Row, Col } from 'react-bootstrap';

const VerPedido = () => {
  const { carrito } = usarCarrito();

  if (carrito.length === 0) {
    return (
      <Container className="my-5 d-flex justify-content-center">
        <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          <h4>El carrito está vacío</h4>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5 d-flex justify-content-center">
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <h4 className="mb-4 text-center titulosprincipales">Tu pedido</h4>
        <ListGroup>
          {carrito.map(producto => (
            <ListGroup.Item key={producto.id}>
              <Row>
                <Col>{producto.name}</Col>
                <Col>Cantidad: {producto.cantidad}</Col>
                <Col>Precio: ${producto.precio * producto.cantidad}</Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    </Container>
  );
};

export default VerPedido;
