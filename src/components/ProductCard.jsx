import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';
import { ajustarPrecio, formatearPrecio } from '../utils/preciosUtils';

const ProductCard = ({ producto }) => {
  const { agregarAlCarrito } = usarCarrito();

  const manejarClick = () => {
    // Crear una copia del producto con el precio ajustado
    const productoConPrecioAjustado = {
      ...producto,
      precio: formatearPrecio(ajustarPrecio(producto.precio))
    };
    
    agregarAlCarrito(productoConPrecioAjustado);

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

  // Calcular y formatear el precio ajustado
  const precioAjustado = formatearPrecio(ajustarPrecio(producto.precio));

  return (
    <Card className='cardsEstilos'>
      <Card.Img variant="top" src={producto.imagen} />
      <Card.Body>
        <Card.Title>{producto.titulo}</Card.Title>
        <br></br>
        {/* <Card.Text className="small">Categoria: {producto.categoria}</Card.Text> */}
        {/* <br></br> */}
        <Card.Text>Precio: <br></br><h4>${precioAjustado}</h4></Card.Text>
        {/* <br></br> */}
        <Button onClick={manejarClick} className="boton-productos">Agregar al carrito</Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
