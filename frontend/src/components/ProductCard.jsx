import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCarritoStore as usarCarrito } from '../store/carritoStore';
import { useAdminConfigStore as usarAdminConfig } from '../store/adminConfigStore';
import Swal from 'sweetalert2';
import { ajustarPrecio, formatearPrecio, parsearPrecio } from '../utils/preciosUtils';
import { trackEvent } from '../api/analytics';
import { useAuth } from '../hooks/useAuth';

const ProductCard = ({ producto, configuracionPrecios }) => {
  const { agregarAlCarrito } = usarCarrito();
  const { mostrarPreciosAdmin } = usarAdminConfig();
  const { isAdmin: esAdmin } = useAuth();

  // Calcular precios (base proveedor y ajustado)
  const precioProveedor = parsearPrecio(producto.precio);
  const precioAjustadoNumero = ajustarPrecio(
    producto.precio,
    producto.titulo,
    producto.categoria,
    configuracionPrecios,
  );
  const precioAjustado = formatearPrecio(precioAjustadoNumero);
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
      <Link to={`/producto/${producto.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card
          className='cardsEstilos'
          style={{
            minHeight: '100%',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          }}
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
      </Link>
  );
};

export default ProductCard;
