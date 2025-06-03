import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Dropdown } from 'react-bootstrap';
import ProductCard from './ProductCard';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';
import Buscador from './Buscador';

const ProductosLista = ({ categoria = null }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { agregarAlCarrito } = usarCarrito();
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('');

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/martuargento/Alebourg/refs/heads/main/public/productosalebourgactulizados.json')
      .then(res => res.json())
      .then(data => {
        let filtrados = data;
        
        if (categoria) {
          const categoriaNormalizada = categoria.toLowerCase()
            .replace(/-/g, '')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
          filtrados = data.filter(producto => {
            const productCategory = producto.categoria.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, '')
              .replace(/[\/&]/g, '');
            
            return productCategory === categoriaNormalizada;
          });
        }
        
        setProductos(filtrados);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error de carga de API", err);
        setLoading(false);
      });
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
    
    const busquedaLower = busqueda.toLowerCase();
    return productos.filter(producto => 
      producto.titulo.toLowerCase().includes(busquedaLower)
    );
  }, [productos, busqueda]);

  const productosOrdenados = useMemo(() => {
    if (!ordenamiento) return productosFiltrados;

    return [...productosFiltrados].sort((a, b) => {
      const precioA = parseFloat(a.precio.replace(/,/g, ''));
      const precioB = parseFloat(b.precio.replace(/,/g, ''));
      
      return ordenamiento === 'menor' ? precioA - precioB : precioB - precioA;
    });
  }, [productosFiltrados, ordenamiento]);

  if (loading) return <div>Cargando productos...</div>;

  return (
    <Container>
      <div className={`d-flex flex-column flex-sm-row align-items-${categoria ? 'start' : 'center'} gap-2 mb-4 buscador-container`}>
        <div className="flex-grow-1">
          <Buscador onBuscar={setBusqueda} />
        </div>
        {categoria && (
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
        <Row xs={1} md={2} lg={3} className="g-4">
          {productosOrdenados.map((producto) => (
            <Col key={producto.id}>
              <ProductCard producto={producto} agregarAlCarrito={manejarAgregar} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ProductosLista;
