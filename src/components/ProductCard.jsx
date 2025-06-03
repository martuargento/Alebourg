import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';
import { ajustarPrecio, formatearPrecio } from '../utils/preciosUtils';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ producto }) => {
  const { agregarAlCarrito } = usarCarrito();
  const navigate = useNavigate();

  const manejarClick = (e) => {
    e.stopPropagation();
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
  const precioAjustado = formatearPrecio(ajustarPrecio(producto.precio, producto.titulo));

  const irADetalle = () => {
    navigate(`/producto/${producto.id}`);
  };

  return (
    <Card 
      className='cardsEstilos' 
      style={{ 
        minHeight: '100%', 
        cursor: 'pointer',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
      onClick={irADetalle}
    >
      <Card.Img 
        variant="top" 
        src={producto.imagen} 
        style={{ 
          height: '200px', 
          objectFit: 'contain', 
          padding: '10px',
          maxWidth: '100%'
        }} 
      />
      <Card.Body className="d-flex flex-column p-2">
        <Card.Title className="mb-3 text-break">{producto.titulo}</Card.Title>
        <Card.Text className="mt-auto">
          Precio: <br />
          <h4>${precioAjustado}</h4>
        </Card.Text>
        <Button 
          onClick={manejarClick} 
          className="boton-productos mt-auto w-100"
        >
          Agregar al carrito
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
