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
    fetch('https://raw.githubusercontent.com/martuargento/Alebourg/refs/heads/main/public/productosalebourgactulizados.json')
      .then(res => res.json())
      .then(data => {
        let filtrados = data;
        
        if (categoria === 'novedades') {
          filtrados = data.filter(producto => producto.Novedades === true);
        } else if (categoria) {
          const categoriaNormalizada = categoria.toLowerCase()
            .replace(/-/g, ' ')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          filtrados = data.filter(producto => {
            const productCategory = producto.categoria.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            return (
              productCategory === categoriaNormalizada ||
              productCategory.includes(categoriaNormalizada) ||
              categoriaNormalizada.includes(productCategory)
            );
          });
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
      text: `${producto.titulo} se agregó al carrito`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  if (loading) return <div>Cargando productos...</div>;

  return (
    <Container className="mt-4">
      <Row>
        {productos.length > 0 ? (
          productos.map(producto => (
            <Col key={producto.id} xs={12} md={4} className="mb-4">
              <ProductCard producto={producto} agregarAlCarrito={manejarAgregar} />
            </Col>
          ))
        ) : (
          <div className="text-center py-5">
            <h4>No se encontraron productos en esta categoría</h4>
          </div>
        )}
      </Row>
    </Container>
  );
};

export default ProductosLista;