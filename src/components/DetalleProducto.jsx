import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import { ajustarPrecio, formatearPrecio } from '../utils/preciosUtils';
import Swal from 'sweetalert2';
import { BACKEND_URL } from '../config';

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const { agregarAlCarrito, carrito } = usarCarrito();
  const [mensajeDescuento, setMensajeDescuento] = useState('');
  const [mostrarBarra, setMostrarBarra] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Hacer scroll al inicio cuando el componente se monta
    window.scrollTo(0, 0);
    
    const fetchProducto = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/martuargento/Alebourg/refs/heads/main/public/productosalebourgactulizados.json');
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
    
    // Calcular incentivo de descuento con la lógica moderna
    fetch(`${BACKEND_URL}/api/descuentos`)
      .then(res => res.json())
      .then(reglasDescuento => {
        const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0) + 1;
        
        // Buscar reglas de descuento por rango de precio
        const reglasRango = reglasDescuento.filter(r => r.tipo === 'rango_precio');
        
        // Calcular cuántos productos en el carrito están en el mismo rango de precio que este producto
        const precioProducto = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
        const productosEnMismoRango = carrito.filter(p => {
          const precioP = ajustarPrecio(p.precio, p.titulo, p.categoria);
          for (const regla of reglasRango) {
            const rangoP = regla.rangos.find(r => precioP >= r.min && (r.max === null || precioP <= r.max));
            const rangoActual = regla.rangos.find(r => precioProducto >= r.min && (r.max === null || precioProducto <= r.max));
            if (rangoP && rangoActual && rangoP === rangoActual) {
              return true;
            }
          }
          return false;
        });
        const cantidadEnMismoRango = productosEnMismoRango.reduce((acc, p) => acc + p.cantidad, 0) + 1;
        
        // Buscar el próximo descuento disponible
        let proximoDescuento = null;
        let faltan = 0;
        
        for (const regla of reglasRango) {
          if (cantidadEnMismoRango < regla.minCantidad) {
            proximoDescuento = regla;
            faltan = regla.minCantidad - cantidadEnMismoRango;
            break;
          }
        }
        
        if (proximoDescuento) {
          // Construir mensaje con los rangos disponibles
          const rangosDisponibles = proximoDescuento.rangos.filter(r => 
            precioProducto >= r.min && (r.max === null || precioProducto <= r.max)
          );
          
          if (rangosDisponibles.length > 0) {
            const rangosPorcentaje = rangosDisponibles.filter(r => r.esPorcentaje && r.descuento < 100);
            const rangosFijos = rangosDisponibles.filter(r => !r.esPorcentaje && r.descuento > 0);
            
            const mensajePartes = [];
            
            if (rangosPorcentaje.length > 0) {
              const porcentajes = rangosPorcentaje.map(r => r.descuento);
              const minP = Math.min(...porcentajes);
              const maxP = Math.max(...porcentajes);
              if (minP === maxP) {
                mensajePartes.push(`hasta ${maxP}% de descuento`);
              } else {
                mensajePartes.push(`descuentos del ${minP}% al ${maxP}%`);
              }
            }
            
            if (rangosFijos.length > 0) {
              const montos = rangosFijos.map(r => r.descuento);
              const maxM = Math.max(...montos);
              mensajePartes.push(`hasta $${maxM} de descuento fijo`);
            }
            
            if (mensajePartes.length > 0) {
              const mensajeFinal = mensajePartes.join(' y ');
                          setMensajeDescuento(`¡Solo te faltan ${faltan} producto${faltan > 1 ? 's' : ''} para desbloquear ${mensajeFinal}!`);
          } else {
            setMensajeDescuento(`¡Agregá ${faltan} producto${faltan > 1 ? 's' : ''} más y obtené descuentos especiales!`);
            }
            
            setFadeOut(false);
            setMostrarBarra(true);
            setTimeout(() => setFadeOut(true), 7500);
            setTimeout(() => setMostrarBarra(false), 8000);
          } else {
            setMostrarBarra(false);
          }
        } else {
          setMostrarBarra(false);
        }
      })
      .catch(error => {
        console.error('Error al obtener reglas de descuento:', error);
        setMostrarBarra(false);
      });
    
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
  const precioAjustado = formatearPrecio(ajustarPrecio(producto.precio, producto.titulo, producto.categoria));

  return (
    <>
      {/* Toast de incentivo de descuento */}
      {mostrarBarra && mensajeDescuento && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0ea5e9 0%, #00ff44 100%)',
          color: '#222',
          fontWeight: 600,
          fontSize: '0.85rem',
          padding: '10px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          letterSpacing: '0.3px',
          borderRadius: 20,
          maxWidth: '90vw',
          width: 'auto',
          animation: fadeOut ? 'fadeOutToast 0.4s forwards' : 'slideInToast 0.3s',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
        }}>
          <div style={{ 
            textAlign: 'center',
            width: '100%',
            lineHeight: '1.3'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🎉</div>
            <div style={{ 
              wordBreak: 'break-word',
              hyphens: 'auto'
            }}>{mensajeDescuento}</div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideInToast {
          from { 
            transform: translate(-50%, -20px); 
            opacity: 0; 
          }
          to { 
            transform: translate(-50%, 0); 
            opacity: 1; 
          }
        }
        @keyframes fadeOutToast {
          from { 
            transform: translate(-50%, 0); 
            opacity: 1; 
          }
          to { 
            transform: translate(-50%, -20px); 
            opacity: 0; 
          }
        }
      `}</style>
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
                  background: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1a1a1a' : 'white',
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
                  background: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1a1a1a' : 'white'
                }}>
                  <h2 style={{
                    fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                    fontWeight: '600',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                    color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#000000'
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
                      marginBottom: '4px',
                      color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#000000'
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
                      marginBottom: '8px',
                      color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#000000'
                    }}>Categoría:</h4>
                    <p style={{
                      margin: '0',
                      padding: '8px 16px',
                      backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                      color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#000000',
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
        
        {/* Barra de mensaje de descuento */}
        {mostrarBarra && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(90deg, #007bff, #28a745)',
              color: '#fff',
              padding: '15px 20px',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: '600',
              zIndex: 9999,
              transform: fadeOut ? 'translateY(100%)' : 'translateY(0)',
              transition: 'transform 0.5s ease-in-out',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.3)'
            }}
          >
            {mensajeDescuento}
          </div>
        )}
        
        <style>
          {`
            /* Estilos para modo oscuro en desktop */
            [data-theme="dark"] .product-image-container {
              background-color: #1a1a1a !important;
            }
            
            [data-theme="dark"] .product-details {
              background-color: #1a1a1a !important;
              color: #ffffff !important;
            }
            
            [data-theme="dark"] .product-details h2 {
              color: #ffffff !important;
            }
            
            [data-theme="dark"] .product-details h4 {
              color: #ffffff !important;
            }
            
            [data-theme="dark"] .categoria-container p {
              background-color: rgba(255, 255, 255, 0.1) !important;
              color: #ffffff !important;
            }
            
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
    </>
  );
};

export default DetalleProducto;