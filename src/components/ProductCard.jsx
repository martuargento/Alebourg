import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';
import { ajustarPrecio, formatearPrecio } from '../utils/preciosUtils';

const ProductCard = ({ producto }) => {
  const { agregarAlCarrito } = usarCarrito();

  const manejarClick = () => {
    // Crear una copia del producto con el precio original (sin formatear)
    const productoParaCarrito = {
      ...producto,
      precio: producto.precio // Mantenemos el precio original para poder ajustarlo después
    };
    
    agregarAlCarrito(productoParaCarrito);

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

  // Calcular y formatear el precio ajustado para mostrar
  const precioAjustado = formatearPrecio(ajustarPrecio(producto.precio));

  return (
    <Card className='cardsEstilos' style={{ minHeight: '100%' }}>
      <Card.Img 
        variant="top" 
        src={producto.imagen} 
        style={{ 
          height: '200px', 
          objectFit: 'contain', 
          padding: '10px' 
        }} 
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="mb-3">{producto.titulo}</Card.Title>
        <Card.Text className="mt-auto">
          Precio: <br />
          <h4>${precioAjustado}</h4>
        </Card.Text>
        <Button 
          onClick={manejarClick} 
          className="boton-productos mt-auto"
        >
          Agregar al carrito
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
