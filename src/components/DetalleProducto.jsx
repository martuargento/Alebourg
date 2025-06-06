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
    // Hacer scroll al inicio cuando el componente se monta
    window.scrollTo(0, 0);
    
    const fetchProducto = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/martinalejandronuniezcursor2/alebourgprueba/refs/heads/main/public/productosalebourgactulizados.json');
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
  const precioAjustado = formatearPrecio(ajustarPrecio(producto.precio, producto.titulo));

  return (
    <Container fluid className="p-0">
      <div style={{
        margin: '0 auto',
        minHeight: '100vh',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)'
        }}>
          <Row className="g-0">
            <Col xs={12} lg={8}>
              <div className="product-image-container" style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '1rem',
                background: 'white',
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
                padding: '1.5rem',
                height: '100%',
                background: 'white'
              }}>
                <h2 style={{
                  fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                  fontWeight: '600',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>{producto.titulo}</h2>
                
                <div className="precio-container" style={{
                  marginBottom: '1.5rem',
                  position: 'relative',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>

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
                    color: '#00ff44'
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
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '20px',
                    display: 'inline-block',
                    fontSize: '0.9rem'
                  }}>{producto.categoria}</p>
                </div>

                <div className="d-grid gap-2">
                  <Button 
                    onClick={manejarAgregar}
                    size="lg"
                    className="boton-productos"
                    style={{
                      padding: '1rem',
                      fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                      fontWeight: '600'
                    }}
                  >
                    Agregar al carrito
                  </Button>
                  <Button 
                    className="boton-productos"
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
      <style>
        {`
          @media (max-width: 768px) {
            /* Eliminar todos los espacios y efectos visuales */
            .product-details {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              background: transparent !important;
            }
            .product-image-container {
              padding: 0 !important;
              margin: 0 !important;
              min-height: auto !important;
            }
            .precio-container {
              border: none !important;
              margin: 0 !important;
              padding: 1rem !important;
              background: none !important;
              background-color: transparent !important;
              box-shadow: none !important;
              outline: none !important;
            }
            .precio-container * {
              border: none !important;
              box-shadow: none !important;
              outline: none !important;
              background: none !important;
            }
            .categoria-container {
              margin: 0 !important;
              padding: 1rem !important;
            }
            h2 {
              margin: 0 !important;
              padding: 1rem !important;
            }
            .d-grid {
              padding: 1rem !important;
            }
            
            /* Estilos específicos para modo claro */
            [data-theme="light"] .product-details,
            [data-theme="light"] .precio-container,
            [data-theme="light"] .precio-container * {
              background: none !important;
              background-color: transparent !important;
              border: none !important;
              box-shadow: none !important;
              outline: none !important;
            }
            
            /* Estilos específicos para modo oscuro */
            [data-theme="dark"] .product-details {
              background-color: rgba(0, 0, 0, 0.2) !important;
            }
            [data-theme="dark"] .product-image-container {
              background-color: rgba(0, 0, 0, 0.2) !important;
            }
            [data-theme="dark"] .categoria-container p {
              background-color: rgba(255, 255, 255, 0.05) !important;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default DetalleProducto;