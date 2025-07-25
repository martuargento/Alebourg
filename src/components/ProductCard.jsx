import React, { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';
import { ajustarPrecio, formatearPrecio } from '../utils/preciosUtils';
import { useNavigate } from 'react-router-dom';

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
    fetch('http://localhost:3001/api/descuentos')
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
          const porcentajes = proximaRegla.rangos.filter(r => r.esPorcentaje && r.descuento > 0 && r.descuento < 100).map(r => r.descuento);
          const fijos = proximaRegla.rangos.filter(r => !r.esPorcentaje && r.descuento > 0).map(r => r.descuento);
          let partes = [];
          if (porcentajes.length > 0) {
            const maxP = Math.max(...porcentajes);
            partes.push(`hasta ${maxP}%`);
          }
          if (fijos.length > 0) {
            const maxF = Math.max(...fijos);
            partes.push(`hasta $${maxF}`);
          }
          let textoDescuento = '';
          if (partes.length === 2) {
            textoDescuento = `${partes[0]} o ${partes[1]}`;
          } else if (partes.length === 1) {
            textoDescuento = partes[0];
          }
          if (textoDescuento) {
            setMensajeDescuento(`¡Agregá ${faltan} producto${faltan > 1 ? 's' : ''} más y obtené descuentos de ${textoDescuento} según el valor de cada producto!`);
          } else {
            setMensajeDescuento(`¡Agregá ${faltan} producto${faltan > 1 ? 's' : ''} más y obtené descuentos especiales según el valor de cada producto!`);
          }
          setFadeOut(false);
          setMostrarBarra(true);
          setTimeout(() => setFadeOut(true), 7500);
          setTimeout(() => setMostrarBarra(false), 8000);
        } else if (mejorRegla) {
          setMensajeDescuento('¡Ya tenés descuento por rango de precio aplicado en cada producto!');
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
              const porcentajes = proximaRegla.rangos.filter(r => r.esPorcentaje && r.descuento > 0 && r.descuento < 100).map(r => r.descuento);
              const fijos = proximaRegla.rangos.filter(r => !r.esPorcentaje && r.descuento > 0).map(r => r.descuento);
              let partes = [];
              if (porcentajes.length > 0) {
                const maxP = Math.max(...porcentajes);
                partes.push(`hasta ${maxP}%`);
              }
              if (fijos.length > 0) {
                const maxF = Math.max(...fijos);
                partes.push(`hasta $${maxF}`);
              }
              let textoDescuento = '';
              if (partes.length === 2) {
                textoDescuento = `${partes[0]} o ${partes[1]}`;
              } else if (partes.length === 1) {
                textoDescuento = partes[0];
              }
              if (textoDescuento) {
                setMensajeDescuento(`¡Agregá ${faltan} producto${faltan > 1 ? 's' : ''} más y obtené descuentos de ${textoDescuento} según el valor de cada producto!`);
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
          <Card.Text className="mt-auto">
            Precio: <br />
            <h4>${precioAjustado}</h4>
          </Card.Text>
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
