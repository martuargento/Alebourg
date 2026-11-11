import { useEffect, useMemo, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useCarritoStore as usarCarrito } from '../store/carritoStore';
import { useAdminConfigStore as usarAdminConfig } from '../store/adminConfigStore';
import Swal from 'sweetalert2';
import { obtenerPrecioFinal, formatearPrecio, parsearPrecio } from '../utils/preciosUtils';
import { trackEvent } from '../api/analytics';
import { useAuth } from '../hooks/useAuth';

const ProductCard = ({ producto, configuracionPrecios, cantidadVisible = 20 }) => {
  const location = useLocation();
  const imagenes = useMemo(() => {
    const galeria = Array.isArray(producto.imagenes) ? producto.imagenes.filter(Boolean) : [];
    return galeria.length ? galeria : producto.imagen ? [producto.imagen] : [];
  }, [producto.imagen, producto.imagenes]);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const { agregarAlCarrito } = usarCarrito();
  const { mostrarPreciosAdmin } = usarAdminConfig();
  const { isAdmin: esAdmin } = useAuth();

  useEffect(() => {
    setIndiceImagen(0);
  }, [producto.id, imagenes]);

  useEffect(() => {
    if (imagenes.length < 2) return undefined;
    const intervalo = setInterval(() => {
      setIndiceImagen((actual) => (actual + 1) % imagenes.length);
    }, 3000);
    return () => clearInterval(intervalo);
  }, [imagenes.length, producto.id]);

  // Calcular precios (base proveedor y ajustado)
  const precioProveedor = parsearPrecio(producto.precio);
  const precioAjustadoNumero = obtenerPrecioFinal(producto, configuracionPrecios);
  const precioAjustado = formatearPrecio(precioAjustadoNumero);
  const precioRegular = producto.enOferta
    ? obtenerPrecioFinal({ ...producto, precioFinal: null }, configuracionPrecios)
    : precioAjustadoNumero;
  const tieneDescuento = producto.enOferta && precioAjustadoNumero < precioRegular;
  const ganancia = Math.max(0, precioAjustadoNumero - precioProveedor);

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
          <Card.Img
            variant="top"
            key={imagenes[indiceImagen]}
            src={imagenes[indiceImagen] || ''}
            alt={`${producto.titulo}, foto ${indiceImagen + 1}`}
            className="product-card-image-carousel"
            style={{
              height: '200px',
              objectFit: 'contain',
              padding: '10px',
              maxWidth: '100%'
            }}
          />
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
