import React, { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import { usarAdminConfig } from '../context/AdminConfigContexto';
import Swal from 'sweetalert2';
import { ajustarPrecio, formatearPrecio, parsearPrecio } from '../utils/preciosUtils';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { trackEvent } from '../services/apiService';

const ProductCard = ({ producto }) => {
  const { agregarAlCarrito, carrito } = usarCarrito();
  const navigate = useNavigate();
  const [mensajeDescuento, setMensajeDescuento] = useState('');
  const [mostrarBarra, setMostrarBarra] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const { mostrarPreciosAdmin } = usarAdminConfig();

  // Calcular precios (base proveedor y ajustado)
  const esAdmin = typeof window !== 'undefined' && localStorage.getItem('esAdmin') === 'true';
  const precioProveedor = parsearPrecio(producto.precio);
  const precioAjustadoNumero = ajustarPrecio(producto.precio, producto.titulo, producto.categoria);
  const precioAjustado = formatearPrecio(precioAjustadoNumero);
  const ganancia = Math.max(0, precioAjustadoNumero - precioProveedor);

  const manejarClick = (e) => {
    e.stopPropagation();
    // Crear una copia del producto con el precio original (sin formatear)
    const productoParaCarrito = {
      ...producto,
      precio: producto.precio // Mantenemos el precio original para poder ajustarlo después
    };
    agregarAlCarrito(productoParaCarrito);
    try {
      trackEvent('add_to_cart', {
        productId: producto.id,
        price: producto.precio,
        title: producto.titulo,
        categoria: producto.categoria
      });
    } catch (_) {}

    // Calcular incentivo de descuento
    fetch(`${BACKEND_URL}/api/descuentos`)
      .then(res => res.json())
      .then(reglasDescuento => {
        const reglasRango = reglasDescuento.filter(r => r.tipo === 'rango_precio');
        const cantidadTotal = carrito.reduce((acc, p) => acc + p.cantidad, 0) + 1;
        // Buscar el próximo escalón
        const proximaRegla = reglasRango
          .filter(r => r.minCantidad > cantidadTotal)
          .sort((a, b) => a.minCantidad - b.minCantidad)[0];
        const mejorRegla = reglasRango
          .filter(r => cantidadTotal >= r.minCantidad)
          .sort((a, b) => b.minCantidad - a.minCantidad)[0];
        if (proximaRegla) {
          const faltan = proximaRegla.minCantidad - cantidadTotal;
          
          // Analizar los rangos para crear un mensaje más específico
          const rangosConDescuento = proximaRegla.rangos.filter(r => r.descuento > 0);
          const rangosPorcentaje = rangosConDescuento.filter(r => r.esPorcentaje);
          const rangosGanancia = rangosConDescuento.filter(r => r.sobreGanancia);
          const rangosFijos = rangosConDescuento.filter(r => !r.esPorcentaje && !r.sobreGanancia);
          
          let mensajePartes = [];
          
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
          
          // NO mostrar descuentos sobre ganancia al cliente
          // if (rangosGanancia.length > 0) {
          //   const porcentajesGanancia = rangosGanancia.map(r => r.descuento);
          //   const maxG = Math.max(...porcentajesGanancia);
          //   mensajePartes.push(`hasta ${maxG}% de descuento sobre ganancia`);
          // }
          
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
        } else if (mejorRegla) {
          // Mensaje cuando ya tiene descuento aplicado
          const rangosActivos = mejorRegla.rangos.filter(r => r.descuento > 0);
          const porcentajes = rangosActivos.filter(r => r.esPorcentaje).map(r => r.descuento);
          const maxPorcentaje = porcentajes.length > 0 ? Math.max(...porcentajes) : 0;
          
          if (maxPorcentaje > 0) {
            setMensajeDescuento(`¡Excelente! Ya tenés descuentos de hasta ${maxPorcentaje}% aplicados`);
          } else {
            setMensajeDescuento(`¡Perfecto! Ya tenés descuentos especiales aplicados`);
          }
          setFadeOut(false);
          setMostrarBarra(true);
          setTimeout(() => setFadeOut(true), 3500);
          setTimeout(() => {
            setMostrarBarra(false);
            // Mostrar el próximo escalón si existe
            const proximaRegla = reglasRango
              .filter(r => r.minCantidad > cantidadTotal)
              .sort((a, b) => a.minCantidad - b.minCantidad)[0];
            if (proximaRegla) {
              const faltan = proximaRegla.minCantidad - cantidadTotal;
              
              // Analizar los rangos para crear un mensaje más específico
              const rangosConDescuento = proximaRegla.rangos.filter(r => r.descuento > 0);
              const rangosPorcentaje = rangosConDescuento.filter(r => r.esPorcentaje);
              const rangosGanancia = rangosConDescuento.filter(r => r.sobreGanancia);
              const rangosFijos = rangosConDescuento.filter(r => !r.esPorcentaje && !r.sobreGanancia);
              
              let mensajePartes = [];
              
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
              
              // NO mostrar descuentos sobre ganancia al cliente
              // if (rangosGanancia.length > 0) {
              //   const porcentajesGanancia = rangosGanancia.map(r => r.descuento);
              //   const maxG = Math.max(...porcentajesGanancia);
              //   mensajePartes.push(`hasta ${maxG}% de descuento sobre ganancia`);
              // }
              
              if (rangosFijos.length > 0) {
                const montos = rangosFijos.map(r => r.descuento);
                const maxM = Math.max(...montos);
                mensajePartes.push(`hasta $${maxM} de descuento fijo`);
              }
              
              if (mensajePartes.length > 0) {
                const mensajeFinal = mensajePartes.join(' y ');
                setMensajeDescuento(`🎉 ¡Solo te faltan ${faltan} producto${faltan > 1 ? 's' : ''} para desbloquear ${mensajeFinal}!`);
                setFadeOut(false);
                setMostrarBarra(true);
                setTimeout(() => setFadeOut(true), 7500);
                setTimeout(() => setMostrarBarra(false), 8000);
              }
            }
          }, 4000);
        } else {
          setMostrarBarra(false);
        }
      });

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

  const irADetalle = () => {
    navigate(`/producto/${producto.id}`);
  };

  return (
    <>
      {/* Barra de incentivo de descuento */}
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
      {/* Animación para el toast */}
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
          <div className="mt-auto">
          {esAdmin && mostrarPreciosAdmin && (
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(97, 68, 159, 0.52)' }}>
                Proveedor: ${formatearPrecio(precioProveedor)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgb(7, 56, 25)' }}>
                Ganancia: ${formatearPrecio(ganancia)}
              </div>
            </div>
          )}
            <div>Precio:</div>
            <h4>${precioAjustado}</h4>
          </div>
          <Button 
            onClick={manejarClick} 
            className="boton-productos mt-auto w-100"
          >
            Agregar al carrito
          </Button>
        </Card.Body>
      </Card>
    </>
  );
};

export default ProductCard;
