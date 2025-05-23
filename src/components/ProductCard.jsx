import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';

const ProductCard = ({ producto }) => {
  const { agregarAlCarrito } = usarCarrito();

  const manejarClick = () => {
    agregarAlCarrito(producto);

    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `"${producto.name}" se agregó al carrito`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <Card>
      <Card.Img variant="top" src={producto.imagen} />
      <Card.Body>
        <Card.Title>{producto.name}</Card.Title>
        <Card.Text>Precio: ${producto.precio}</Card.Text>
        <Button onClick={manejarClick} className="boton-productos">Agregar al carrito</Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
