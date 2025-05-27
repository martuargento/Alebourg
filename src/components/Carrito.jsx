import React from 'react';
import { usarCarrito } from '../context/CarritoContexto'; 
import { ListGroup, Button } from 'react-bootstrap';

const Carrito = () => {
  const { carrito, eliminarDelCarrito, vaciarCarrito } = usarCarrito();

  if (carrito.length === 0) return <p>El carrito está vacío.</p>;

  return (
    <div>
      <h4>Tu carrito</h4>
      <ListGroup>
        {carrito.map(producto => (
          <ListGroup.Item key={producto.FIELD1} className="d-flex justify-content-between align-items-center">
            {producto.FIELD2} - ${producto.FIELD3}
            <Button variant="danger" size="sm" onClick={() => eliminarDelCarrito(producto.FIELD1)}>Eliminar</Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button variant="secondary" className="mt-3" onClick={vaciarCarrito}>
        Vaciar carrito
      </Button>
    </div>
  );
};

export default Carrito;
