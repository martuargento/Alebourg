import React, { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';
import { ajustarPrecio, formatearPrecio } from '../utils/preciosUtils';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';

const ProductCard = ({ producto }) => {
  const { agregarAlCarrito, carrito } = usarCarrito();
  const navigate = useNavigate();
  const [mensajeDescuento, setMensajeDescuento] = useState('');
  const [mostrarBarra, setMostrarBarra] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Calcular y formatear el precio ajustado para mostrar
  const precioAjustado = formatearPrecio(ajustarPrecio(producto.precio, producto.titulo, producto.categoria));

  const manejarClick = (e) => {
    e.stopPropagation();
    // Crear una copia del producto con el precio original (sin formatear)
    const productoParaCarrito = {
      ...producto,
      precio: producto.precio // Mantenemos el precio original para poder ajustarlo después
    };
    agregarAlCarrito(productoParaCarrito);

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
            setMensajeDescuento(`🎉 ¡Solo te faltan ${faltan} producto${faltan > 1 ? 's' : ''} para desbloquear ${mensajeFinal}!`);
          } else {
            setMensajeDescuento(`🎉 ¡Agregá ${faltan} producto${faltan > 1 ? 's' : ''} más y obtené descuentos especiales!`);
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
            setMensajeDescuento(`✅ ¡Excelente! Ya tenés descuentos de hasta ${maxPorcentaje}% aplicados`);
          } else {
            setMensajeDescuento(`✅ ¡Perfecto! Ya tenés descuentos especiales aplicados`);
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
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'linear-gradient(90deg, #0ea5e9 0%, #00ff44 100%)',
          color: '#222',
          fontWeight: 600,
          fontSize: '1.15rem',
          textAlign: 'center',
          padding: '18px 0 14px 0',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.12)',
          letterSpacing: '0.5px',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          animation: fadeOut ? 'fadeOutBar 0.5s forwards' : 'slideUpBar 0.3s',
          transition: 'opacity 0.5s',
        }}>
          {mensajeDescuento}
        </div>
      )}
      {/* Animación para la barra */}
      <style>{`
        @keyframes slideUpBar {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeOutBar {
          from { opacity: 1; }
          to { opacity: 0; }
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
