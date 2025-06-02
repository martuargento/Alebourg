import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const { agregarAlCarrito } = usarCarrito();

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/martuargento/Alebourg/main/public/productosalebourgactulizados.json');
        const data = await response.json();
        const productoEncontrado = data.find(p => p.id === parseInt(id));
        
        if (productoEncontrado) {
          setProducto(productoEncontrado);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar el producto:', error);
        setLoading(false);
      }
    };

    fetchProducto();
  }, [id]);

  const manejarAgregar = () => {
    agregarAlCarrito(producto);
    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `${producto.titulo} se agregó al carrito`,
      timer: 1500,
      showConfirmButton: false,
      background: '#1e1e1e',
      color: '#fff',
    });
  };

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  if (!producto) {
    return (
      <div className="text-center mt-5">
        <h2>Producto no encontrado</h2>
        <Button variant="primary" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <Container className="py-3">
      <div className="product-container" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        padding: '15px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Row className="g-0">
          <Col xs={12} md={6}>
            <div className="product-image-container" style={{ 
              padding: '10px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px'
            }}>
              <img
                src={producto.imagen}
                alt={producto.titulo}
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="product-details p-3">
              <h2 className="h3 mb-3">{producto.titulo}</h2>
              <div className="mb-3">
                <h3 className="h4 text-primary mb-0">Precio: ${producto.precio}</h3>
              </div>
              <div className="mb-3">
                <h4 className="h5 mb-1">Categoría:</h4>
                <p className="mb-3">{producto.categoria}</p>
              </div>
              <div className="d-grid gap-2">
                <Button 
                  onClick={manejarAgregar}
                  size="lg"
                  className="boton-productos"
                >
                  Agregar al carrito
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => navigate(-1)}
                >
                  Volver
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default DetalleProducto;