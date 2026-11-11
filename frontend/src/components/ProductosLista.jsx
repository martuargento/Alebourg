import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Container, Row, Col, Dropdown, Button } from 'react-bootstrap';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProductCard from './ProductCard';
import Buscador from './Buscador';
import { sonCategoriasIguales } from '../utils/categoriasUtils';
import { productQueryKey, useProductos } from '../hooks/useProductos';
import { useCarruselConfig, usePreciosConfig } from '../hooks/useConfiguracion';
import { useAuth } from '../hooks/useAuth';
import {
  guardarConfiguracionProductos,
  obtenerConfiguracionProductos,
  obtenerProductosDestacados,
} from '../api/administracionProductos';
import { obtenerErrorApi } from '../api/products';
import { obtenerPrecioFinal, parsearPrecio } from '../utils/preciosUtils';

const ProductosLista = ({ categoria = null }) => {
  const { data: catalogo = [], isLoading, isFetching, error } = useProductos();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { data: configuracionPrecios } = usePreciosConfig();
  const { data: configuracionCarrusel } = useCarruselConfig();
  const [inicioCarrusel] = useState(() => Date.now());
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const busqueda = searchParams.get('q') || '';
  const [ordenamiento, setOrdenamiento] = useState(sessionStorage.getItem('ordenamiento') || '');
  const [productosVisibles, setProductosVisibles] = useState(() => {
    const cantidadRestaurar = location.state?.restoreProductosVisibles;
    return Number.isSafeInteger(cantidadRestaurar) && cantidadRestaurar > 0
      ? cantidadRestaurar
      : 20;
  });
  const [configuracionAdmin, setConfiguracionAdmin] = useState(null);
  const [productoArrastrado, setProductoArrastrado] = useState(null);
  const [errorAdmin, setErrorAdmin] = useState('');
  const scrollRestauradoPara = useRef(null);
  const {
    data: destacados = { masVendidos: [], ofertas: [] },
    error: errorDestacados,
  } = useQuery({
    queryKey: ['productos-destacados'],
    queryFn: obtenerProductosDestacados,
    enabled: !categoria,
  });

  useEffect(() => {
    sessionStorage.setItem('ordenamiento', ordenamiento);
  }, [ordenamiento]);

  useEffect(() => {
    if (!isAdmin && ordenamiento.startsWith('ganancia-')) setOrdenamiento('');
  }, [isAdmin, ordenamiento]);

  useEffect(() => {
    const scrollY = location.state?.restoreScrollY;
    if (
      typeof scrollY !== 'number'
      || isFetching
      || scrollRestauradoPara.current === location.key
    ) return undefined;
    scrollRestauradoPara.current = location.key;
    const frame = requestAnimationFrame(() => window.scrollTo(0, scrollY));
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.state, isFetching]);

  useEffect(() => {
    if (!isAdmin) {
      setConfiguracionAdmin(null);
      return undefined;
    }
    let activo = true;
    obtenerConfiguracionProductos()
      .then((configuracion) => { if (activo) setConfiguracionAdmin(configuracion); })
      .catch((errorCarga) => {
        if (activo) setErrorAdmin(obtenerErrorApi(errorCarga, 'No se pudo cargar la configuración de productos.'));
      });
    return () => { activo = false; };
  }, [isAdmin]);

  const guardarConfigAdmin = useCallback(async (configuracion) => {
    setErrorAdmin('');
    try {
      const actualizada = await guardarConfiguracionProductos(configuracion);
      setConfiguracionAdmin(actualizada);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['productos-destacados'] }),
      ]);
    } catch (errorGuardar) {
      setErrorAdmin(obtenerErrorApi(errorGuardar, 'No se pudo guardar la configuración de productos.'));
      throw errorGuardar;
    }
  }, [queryClient]);

  const reordenarProductos = useCallback(async (idOrigen, idDestino, lista = 'catalogo') => {
    if (!configuracionAdmin || !idOrigen || !idDestino || idOrigen === idDestino) return;
    const campo = lista === 'masVendidos' ? 'masVendidos' : lista === 'ofertas' ? 'ofertas' : 'orden';
    const idsBase = campo === 'orden' && !configuracionAdmin.orden.length
      ? catalogo.map((producto) => producto.id)
      : configuracionAdmin[campo];
    const ids = campo === 'orden'
      ? [
        ...idsBase,
        ...catalogo.map((producto) => producto.id).filter((id) => !idsBase.includes(id)),
      ]
      : [...idsBase];
    const desde = ids.indexOf(idOrigen);
    const hasta = ids.indexOf(idDestino);
    if (desde < 0 || hasta < 0) return;
    ids.splice(hasta, 0, ids.splice(desde, 1)[0]);
    await guardarConfigAdmin({
      ...configuracionAdmin,
      [campo]: ids,
      ...(campo === 'orden' ? { ordenPersonalizadoActivo: true } : {}),
    });
  }, [configuracionAdmin, catalogo, guardarConfigAdmin]);

  const handleBuscar = (valor) => {
    setSearchParams(params => {
      params.set('q', valor);
      return params;
    });
  };

  const productos = useMemo(() => (
    categoria
      ? catalogo.filter((producto) => sonCategoriasIguales(producto.categoria, categoria))
      : catalogo
  ), [catalogo, categoria]);

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
    if (ordenamiento.startsWith('ganancia-') && (!isAdmin || !configuracionPrecios)) {
      return productosFiltrados;
    }

    return [...productosFiltrados].sort((a, b) => {
      if (ordenamiento.startsWith('ganancia-')) {
        const gananciaA = Math.max(0, obtenerPrecioFinal(a, configuracionPrecios) - parsearPrecio(a.precio));
        const gananciaB = Math.max(0, obtenerPrecioFinal(b, configuracionPrecios) - parsearPrecio(b.precio));
        return ordenamiento === 'ganancia-menor'
          ? gananciaA - gananciaB
          : gananciaB - gananciaA;
      }

      const precioA = parsearPrecio(a.precio);
      const precioB = parsearPrecio(b.precio);
      return ordenamiento === 'menor' ? precioA - precioB : precioB - precioA;
    });
  }, [productosFiltrados, ordenamiento, isAdmin, configuracionPrecios]);

  const modoOrdenPersonalizado = Boolean(
    isAdmin
    && configuracionAdmin?.ordenPersonalizadoActivo
    && !ordenamiento
    && !busqueda,
  );

  function renderizarDestacados(titulo, lista, clave) {
    if (!lista?.length || categoria || busqueda) return null;
    const puedeReordenar = isAdmin && configuracionAdmin && !busqueda;
    return (
      <section className="mb-4" aria-label={titulo}>
        <h4 className="featured-products-title">{titulo}</h4>
        <div className="featured-products-grid">
          {lista.map((producto) => (
            <div
              key={producto.id}
              className="featured-product-item"
              draggable={puedeReordenar}
              onDragStart={() => setProductoArrastrado({ id: producto.id, lista: clave })}
              onDragOver={(evento) => { if (puedeReordenar) evento.preventDefault(); }}
              onDrop={(evento) => {
                evento.preventDefault();
                if (puedeReordenar && productoArrastrado?.lista === clave) {
                  reordenarProductos(productoArrastrado.id, producto.id, clave)
                    .catch(() => {});
                }
                setProductoArrastrado(null);
              }}
              onDragEnd={() => setProductoArrastrado(null)}
              style={{ cursor: puedeReordenar ? 'grab' : undefined }}
            >
              <ProductCard
                producto={producto}
                configuracionPrecios={configuracionPrecios}
                configuracionCarrusel={configuracionCarrusel}
                inicioCarrusel={inicioCarrusel}
                cantidadVisible={productosVisibles}
              />
            </div>
          ))}
        </div>
        {puedeReordenar && <small className="text-white-50">Arrastrá los productos para cambiar el orden.</small>}
      </section>
    );
  }

  const cargarMasProductos = () => {
    setProductosVisibles(prev => prev + 20);
  };

  if (isLoading) return <div>Cargando productos...</div>;
  if (error) return <div role="alert">No se pudieron cargar los productos. {error.message}</div>;

  const productosAMostrar = productosOrdenados.slice(0, productosVisibles);
  const hayMasProductos = productosVisibles < productosOrdenados.length;

  return (
    <Container fluid className="p-0">
      <div className={`d-flex flex-column flex-sm-row align-items-${categoria ? 'start' : 'center'} gap-2 mb-3 buscador-container px-2`}>
        <div className="flex-grow-1">
          <Buscador onBuscar={handleBuscar} busquedaInicial={busqueda} />
        </div>
        {isAdmin && (
          <div className="d-flex align-items-center gap-2 mb-3 px-2">
            <FormSwitchOrden
              activo={Boolean(configuracionAdmin?.ordenPersonalizadoActivo)}
              deshabilitado={!configuracionAdmin}
              alCambiar={(activo) => guardarConfigAdmin({
                ...configuracionAdmin,
                ordenPersonalizadoActivo: activo,
                orden: configuracionAdmin.orden.length
                  ? configuracionAdmin.orden
                  : catalogo.map((producto) => producto.id),
              }).catch(() => {})}
            />
            <span className="text-white">Orden personalizado</span>
            {configuracionAdmin?.ordenPersonalizadoActivo && (
              <small className="text-white-50">Elegí “Sin ordenar”; se guarda automáticamente al soltar cada producto.</small>
            )}
          </div>
        )}
        {errorAdmin && <div className="alert alert-danger mx-2" role="alert">{errorAdmin}</div>}
        {errorDestacados && !categoria && (
          <div className="alert alert-warning mx-2" role="alert">
            No se pudieron cargar las listas destacadas. {obtenerErrorApi(errorDestacados, 'Intentá recargar la tienda.')}
          </div>
        )}
        {(categoria || productosFiltrados.length > 1) && (
          <Dropdown className="ordenamiento-dropdown">
            <Dropdown.Toggle variant="outline-light" id="dropdown-ordenamiento">
              {ordenamiento === 'menor' ? 'Menor precio' : 
               ordenamiento === 'mayor' ? 'Mayor precio' : 
               ordenamiento === 'ganancia-menor' ? 'Ganancia: menor a mayor' :
               ordenamiento === 'ganancia-mayor' ? 'Ganancia: mayor a menor' :
               'Ordenar por precio'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setOrdenamiento('menor')}>Menor precio</Dropdown.Item>
              <Dropdown.Item onClick={() => setOrdenamiento('mayor')}>Mayor precio</Dropdown.Item>
              {isAdmin && (
                <>
                  <Dropdown.Item onClick={() => setOrdenamiento('ganancia-menor')}>
                    Ganancia: menor a mayor
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setOrdenamiento('ganancia-mayor')}>
                    Ganancia: mayor a menor
                  </Dropdown.Item>
                </>
              )}
              <Dropdown.Item onClick={() => setOrdenamiento('')}>Sin ordenar</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
      {renderizarDestacados('Más vendidos', destacados.masVendidos, 'masVendidos')}
      {renderizarDestacados('Ofertas', destacados.ofertas, 'ofertas')}
      
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
                <div
                  draggable={modoOrdenPersonalizado}
                  onDragStart={() => setProductoArrastrado({ id: producto.id, lista: 'catalogo' })}
                  onDragOver={(evento) => { if (modoOrdenPersonalizado) evento.preventDefault(); }}
                  onDrop={(evento) => {
                    evento.preventDefault();
                    if (modoOrdenPersonalizado && productoArrastrado?.lista === 'catalogo') {
                      reordenarProductos(productoArrastrado.id, producto.id)
                        .catch(() => {});
                    }
                    setProductoArrastrado(null);
                  }}
                  onDragEnd={() => setProductoArrastrado(null)}
                  style={{ position: 'relative', cursor: modoOrdenPersonalizado ? 'grab' : undefined }}
                >
                  {modoOrdenPersonalizado && (
                    <small className="position-absolute top-0 end-0 z-1 px-2 py-1 bg-dark text-white rounded-bottom-start">
                      Arrastrar
                    </small>
                  )}
                  <ProductCard
                    producto={producto}
                    configuracionPrecios={configuracionPrecios}
                    configuracionCarrusel={configuracionCarrusel}
                    inicioCarrusel={inicioCarrusel}
                    cantidadVisible={productosVisibles}
                  />
                </div>
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

function FormSwitchOrden({ activo, deshabilitado, alCambiar }) {
  return (
    <input
      type="checkbox"
      className="form-check-input m-0"
      role="switch"
      aria-label="Activar orden personalizado"
      checked={activo}
      disabled={deshabilitado}
      onChange={(evento) => alCambiar(evento.target.checked)}
    />
  );
}

export default ProductosLista;
