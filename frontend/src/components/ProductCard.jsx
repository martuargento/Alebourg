import { useEffect, useMemo, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useCarritoStore as usarCarrito } from '../store/carritoStore';
import { useAdminConfigStore as usarAdminConfig } from '../store/adminConfigStore';
import Swal from 'sweetalert2';
import { obtenerPrecioFinal, formatearPrecio, parsearPrecio } from '../utils/preciosUtils';
import { trackEvent } from '../api/analytics';
import { useAuth } from '../hooks/useAuth';

const ProductCard = ({
  producto,
  configuracionPrecios,
  configuracionCarrusel,
  inicioCarrusel,
  cantidadVisible = 20,
}) => {
  const location = useLocation();
  const imagenes = useMemo(() => {
    const galeria = Array.isArray(producto.imagenes) ? producto.imagenes.filter(Boolean) : [];
    return galeria.length ? galeria : producto.imagen ? [producto.imagen] : [];
  }, [producto.imagen, producto.imagenes]);
  const intervaloSegundos = configuracionCarrusel?.mode === 'individual'
    ? configuracionCarrusel.productIntervals?.[String(producto.id)] ?? configuracionCarrusel.intervalSeconds
    : configuracionCarrusel?.intervalSeconds ?? 6;
  const intervaloMs = intervaloSegundos * 1000;
  const firmaGaleria = imagenes.join('\u0000');
  const [faseCarrusel, setFaseCarrusel] = useState(0);
  const [transicionIniciada, setTransicionIniciada] = useState(false);
  const { agregarAlCarrito } = usarCarrito();
  const { mostrarPreciosAdmin } = usarAdminConfig();
  const { isAdmin: esAdmin } = useAuth();

  useEffect(() => {
    const tiempoTranscurrido = Math.max(0, Date.now() - inicioCarrusel);
    setFaseCarrusel(Math.floor(tiempoTranscurrido / intervaloMs));
    setTransicionIniciada(false);
    if (imagenes.length < 2) return undefined;

    let temporizador;
    const avanzarSincronizado = () => {
      const ahora = Date.now();
      const transcurrido = Math.max(0, ahora - inicioCarrusel);
      setFaseCarrusel(Math.floor(transcurrido / intervaloMs));
      setTransicionIniciada(true);
      temporizador = setTimeout(
        avanzarSincronizado,
        intervaloMs - (transcurrido % intervaloMs),
      );
    };
    const transcurrido = Math.max(0, Date.now() - inicioCarrusel);
    const demoraInicial = intervaloMs - (transcurrido % intervaloMs);
    temporizador = setTimeout(avanzarSincronizado, demoraInicial);
    return () => clearTimeout(temporizador);
  }, [firmaGaleria, inicioCarrusel, intervaloMs, producto.id, imagenes.length]);

  // Calcular precios (base proveedor y ajustado)
  const precioProveedor = parsearPrecio(producto.precio);
  const precioAjustadoNumero = obtenerPrecioFinal(producto, configuracionPrecios);
  const precioAjustado = formatearPrecio(precioAjustadoNumero);
  const precioRegular = producto.enOferta
    ? obtenerPrecioFinal({ ...producto, precioFinal: null }, configuracionPrecios)
    : precioAjustadoNumero;
  const tieneDescuento = producto.enOferta && precioAjustadoNumero < precioRegular;
  const ganancia = Math.max(0, precioAjustadoNumero - precioProveedor);
  const indiceImagen = imagenes.length ? faseCarrusel % imagenes.length : 0;
  const indiceAnterior = imagenes.length
    ? (indiceImagen + imagenes.length - 1) % imagenes.length
    : 0;

  const manejarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    agregarAlCarrito(producto);
    trackEvent('add_to_cart', {
      productId: producto.id,
      price: producto.precio,
      title: producto.titulo,
      categoria: producto.categoria,
    }).catch((error) => console.error('No se pudo registrar el evento del carrito:', error));

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

  return (
      <Link
        to={`/producto/${producto.id}`}
        state={{ from: `${location.pathname}${location.search}` }}
        onClick={() => {
          sessionStorage.setItem('alebourg:product-list-scroll', String(window.scrollY));
          sessionStorage.setItem('alebourg:product-list-visible-count', String(cantidadVisible));
        }}
        className="product-card-link"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <Card
          className='cardsEstilos'
          style={{
            height: '100%',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          }}
        >
          <div
            className="product-card-image-carousel"
            role="img"
            aria-label={`${producto.titulo}, foto ${indiceImagen + 1}`}
            style={{
              height: '200px',
            }}
          >
            {transicionIniciada && (
              <img
                key={`anterior-${faseCarrusel}`}
                src={imagenes[indiceAnterior]}
                alt=""
                aria-hidden="true"
                className="product-card-image-layer product-card-image-out"
              />
            )}
            <img
              key={`actual-${faseCarrusel}`}
              src={imagenes[indiceImagen]}
              alt={`${producto.titulo}, foto ${indiceImagen + 1}`}
              className={`product-card-image-layer${transicionIniciada ? ' product-card-image-in' : ''}`}
            />
          </div>
          <Card.Body className="d-flex flex-column p-2">
            <Card.Title className="product-card-title mb-3 text-break">{producto.titulo}</Card.Title>
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
              <div className="product-card-price-meta">
                {producto.enOferta && <span className="badge text-bg-danger">OFERTA</span>}
                {tieneDescuento && (
                  <small className="text-decoration-line-through text-secondary">
                  ${formatearPrecio(precioRegular)}
                  </small>
                )}
              </div>
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
      </Link>
  );
};

export default ProductCard;
