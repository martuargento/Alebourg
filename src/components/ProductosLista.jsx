import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';  
import Swal from 'sweetalert2';

const ProductosLista = ({ category = null }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://682f69eef504aa3c70f3f01a.mockapi.io/productos')
      .then(res => res.json())
      .then(data => {
        let filtrados = data;
        if (category === 'novedades') {
          filtrados = data.filter(producto => producto.Novedades === true);
        }
        setProductos(filtrados);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error de carga de API", err);
        setLoading(false);
      });
  }, [category]);

 const agregarAlCarrito = (producto) => {
    Swal.fire({
      title: '¡Producto agregado!',
      text: `El producto "${producto.name}" se agregó al carrito.`,
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
};

  if (loading) return <div>Cargando productos...</div>;

  return (
    <Container className="mt-4">
      <Row>
        {productos.map(producto => (
          <Col key={producto.id} md={4}>
            <ProductCard producto={producto} agregarAlCarrito={agregarAlCarrito} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ProductosLista;
