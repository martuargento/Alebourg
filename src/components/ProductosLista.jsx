import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';  
import { usarCarrito } from '../context/CarritoContexto';  
import Swal from 'sweetalert2';

const ProductosLista = ({ categoria = null }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { agregarAlCarrito } = usarCarrito();

  useEffect(() => {
    fetch('https://682f69eef504aa3c70f3f01a.mockapi.io/productos')
      .then(res => res.json())
      .then(data => {
        let filtrados = data;
        if (categoria === 'novedades') {
          filtrados = data.filter(producto => producto.Novedades === true);
        }
        setProductos(filtrados);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error de carga de API", err);
        setLoading(false);
      });
  }, [categoria]);

  const manejarAgregar = (producto) => {
    agregarAlCarrito(producto);
    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `"${producto.name}" se agregó al carrito`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  if (loading) return <div>Cargando productos...</div>;

  return (
    <Container className="mt-4">
      <Row>
        {productos.map(producto => (
          <Col key={producto.id} md={4}>
            <ProductCard producto={producto} agregarAlCarrito={manejarAgregar} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ProductosLista;
