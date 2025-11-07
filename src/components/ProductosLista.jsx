import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Dropdown, Button } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';
import Buscador from './Buscador';
import { getProductos } from '../services/apiService';
import { categorySlugEquals } from '../utils/slug';

const ProductosLista = ({ categoria = null }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { agregarAlCarrito } = usarCarrito();
  const [searchParams, setSearchParams] = useSearchParams();
  const busqueda = searchParams.get('q') || '';
  const [ordenamiento, setOrdenamiento] = useState(sessionStorage.getItem('ordenamiento') || '');
  const [productosVisibles, setProductosVisibles] = useState(20);

  useEffect(() => {
    sessionStorage.setItem('ordenamiento', ordenamiento);
  }, [ordenamiento]);

  const handleBuscar = (valor) => {
    setSearchParams(params => {
      params.set('q', valor);
      return params;
    });
  };

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await getProductos();
        try { console.log('[Alebourg] Productos cargados en lista:', data.length); } catch (_) {}
        let filtrados = data;
        
        if (categoria) {
          filtrados = data.filter(producto => categorySlugEquals(producto.categoria, categoria));
        }
        
        setProductos(filtrados);
        setLoading(false);
      } catch (err) {
        console.error("Error de carga de productos", err);
        setLoading(false);
      }
    };

    cargarProductos();
  }, [categoria]);

  const manejarAgregar = (producto) => {
    agregarAlCarrito(producto);
    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `${producto.titulo} se agregó al carrito`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const productosFiltrados = useMemo(() => {
    if (!busqueda) return productos;
    
    const q = busqueda.toLowerCase();
    return productos.filter(producto => {
      const t = (producto.titulo || '').toLowerCase();
      const c = (producto.categoria || '').toLowerCase();
      return t.includes(q) || c.includes(q) || String(producto.id).includes(q);
    });
  }, [productos, busqueda]);

  const productosOrdenados = useMemo(() => {
    if (!ordenamiento) return productosFiltrados;

    return [...productosFiltrados].sort((a, b) => {
      const precioA = parseFloat(a.precio.replace(/,/g, ''));
      const precioB = parseFloat(b.precio.replace(/,/g, ''));
      
      return ordenamiento === 'menor' ? precioA - precioB : precioB - precioA;
    });
  }, [productosFiltrados, ordenamiento]);

  const cargarMasProductos = () => {
    setProductosVisibles(prev => prev + 20);
  };

  if (loading) return <div>Cargando productos...</div>;

  const productosAMostrar = productosOrdenados.slice(0, productosVisibles);
  const hayMasProductos = productosVisibles < productosOrdenados.length;

  return (
    <Container fluid className="p-0">
      <div className={`d-flex flex-column flex-sm-row align-items-${categoria ? 'start' : 'center'} gap-2 mb-3 buscador-container px-2`}>
        <div className="flex-grow-1">
          <Buscador onBuscar={handleBuscar} busquedaInicial={busqueda} />
        </div>
        {(categoria || productosFiltrados.length > 1) && (
          <Dropdown className="ordenamiento-dropdown">
            <Dropdown.Toggle variant="outline-light" id="dropdown-ordenamiento">
              {ordenamiento === 'menor' ? 'Menor precio' : 
               ordenamiento === 'mayor' ? 'Mayor precio' : 
               'Ordenar por precio'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setOrdenamiento('menor')}>Menor precio</Dropdown.Item>
              <Dropdown.Item onClick={() => setOrdenamiento('mayor')}>Mayor precio</Dropdown.Item>
              <Dropdown.Item onClick={() => setOrdenamiento('')}>Sin ordenar</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
      
      {productosOrdenados.length === 0 ? (
        <div className="text-center text-white mt-5">
          <h4>No se encontraron productos que coincidan con tu búsqueda</h4>
          <p className="text-muted">Intenta con otros términos</p>
        </div>
      ) : (
        <>
          <div className="productos-grid px-2">
            {productosAMostrar.map((producto) => (
              <div key={producto.id} className="producto-item">
                <ProductCard producto={producto} agregarAlCarrito={manejarAgregar} />
              </div>
            ))}
          </div>
          
          {hayMasProductos && (
            <div className="text-center mt-4 mb-4">
              <Button 
                className="boton-productos px-4 py-2"
                onClick={cargarMasProductos}
              >
                Ver más productos
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductosLista;
