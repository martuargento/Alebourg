import React from 'react';
import { Card, Button } from 'react-bootstrap';

const ProductCard = ({ producto, agregarAlCarrito }) => {
  return (
    <Card className="h-100 d-flex flex-column m-2">
      <Card.Img
        variant="top"
        src={producto.imagen}
        alt={producto.name}
        style={{ height: '200px', objectFit: 'cover' }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{producto.name}</Card.Title>
        <Card.Text>
          Categoria: {producto.Rubro || 'N/A'}
        </Card.Text>
        <Card.Text>
          <strong>Precio: {producto.precio || 'N/A'}</strong>
        </Card.Text>
        <Button
          variant="primary"
          onClick={() => agregarAlCarrito(producto)}
          className="mt-auto"
        >
          Agregar al carrito
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
