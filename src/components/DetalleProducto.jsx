import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import { ajustarPrecio, formatearPrecio } from '../utils/preciosUtils';
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

  // Calcular el precio ajustado
  const precioAjustado = formatearPrecio(ajustarPrecio(producto.precio));

  return (
    <Container fluid className="p-0">
      <div className="product-container" style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        margin: '0 auto',
        minHeight: '100vh',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <Row className="g-0">
            <Col xs={12} lg={8}>
              <div className="product-image-container" style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0.5rem',
                minHeight: '30vh'
              }}>
                <img
                  src={producto.imagen}
                  alt={producto.titulo}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    maxHeight: '70vh'
                  }}
                />
              </div>
            </Col>
            <Col xs={12} lg={4}>
              <div className="product-details" style={{
                padding: '1rem',
                height: '100%'
              }}>
                <h2 style={{
                  fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>{producto.titulo}</h2>
                
                <div className="precio-container" style={{
                  marginBottom: '1.5rem',
                  position: 'relative',
                  padding: '1.5rem',
                  background: 'linear-gradient(145deg, rgba(0,255,0,0.05) 0%, rgba(0,0,0,0) 100%)',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,255,0,0.15)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#00cc44',
                    color: 'black',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    transform: 'rotate(5deg)'
                  }}>
                    ¡Disponible!
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    opacity: '0.8',
                    marginBottom: '4px'
                  }}>
                    Precio:
                  </div>
                  <div style={{
                    fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
                    fontWeight: '800',
                    color: '#00ff44',
                    textShadow: '0 0 15px rgba(0,255,68,0.3)',
                    lineHeight: '1'
                  }}>
                    ${precioAjustado}
                  </div>
                </div>

                <div className="categoria-container" style={{
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  <h4 style={{ 
                    fontSize: '0.9rem',
                    opacity: '0.8',
                    marginBottom: '8px'
                  }}>Categoría:</h4>
                  <p style={{
                    margin: '0',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    display: 'inline-block',
                    fontSize: '0.9rem'
                  }}>{producto.categoria}</p>
                </div>

                <div className="d-grid gap-2">
                  <Button 
                    onClick={manejarAgregar}
                    size="lg"
                    style={{
                      padding: '1rem',
                      fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                      fontWeight: '600',
                      backgroundColor: '#333',
                      border: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Agregar al carrito
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                    style={{
                      padding: '0.75rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    Volver
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Container>
  );
};

export default DetalleProducto;