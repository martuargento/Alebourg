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
      text: `"${producto.titulo}" se agregó al carrito`,
      timer: 1500,
      showConfirmButton: false,
      background: '#1e1e1e',
      color: '#fff',
      confirmButtonColor: '#3085d6'
    });
  };

  return (
    <Card className='cardsEstilos'>
      <Card.Img variant="top" src={producto.imagen} />
      <Card.Body>
        <Card.Title>{producto.titulo}</Card.Title>
        <Card.Text>Precio: {producto.precio}</Card.Text>
        <Button onClick={manejarClick} className="boton-productos">Agregar al carrito</Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
