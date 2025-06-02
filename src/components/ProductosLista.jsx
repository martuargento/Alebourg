import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';
import { usarCarrito } from '../context/CarritoContexto';
import Swal from 'sweetalert2';
import Buscador from './Buscador';

const ProductosLista = ({ categoria = null }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { agregarAlCarrito } = usarCarrito();
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/martuargento/Alebourg/refs/heads/main/public/productosalebourgactulizados.json')
      .then(res => res.json())
      .then(data => {
        let filtrados = data;
        
        if (categoria) {
        const categoriaNormalizada = categoria.toLowerCase()
          .replace(/-/g, ' ')
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        filtrados = data.filter(producto => {
          const productCategory = producto.categoria.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          return (
            productCategory === categoriaNormalizada ||
            productCategory.includes(categoriaNormalizada) ||
            categoriaNormalizada.includes(productCategory)
          );
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

    const terminoBusqueda = busqueda.toLowerCase().trim();
    
    return productos.filter(producto => {
      const titulo = producto.titulo.toLowerCase();
      const descripcion = producto.descripcion ? producto.descripcion.toLowerCase() : '';
      
      // Dividir el término de búsqueda en palabras
      const palabrasBusqueda = terminoBusqueda.split(' ');
      
      // Verificar si todas las palabras de búsqueda están en el título o descripción
      return palabrasBusqueda.every(palabra => 
        titulo.includes(palabra) || descripcion.includes(palabra)
      );
    });
  }, [productos, busqueda]);

  if (loading) return <div>Cargando productos...</div>;

  return (
    <Container>
      <Buscador onBuscar={setBusqueda} />
      
      {productosFiltrados.length === 0 ? (
        <div className="text-center text-white mt-5">
          <h4>No se encontraron productos que coincidan con tu búsqueda</h4>
          <p className="text-muted">Intenta con otros términos</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {productosFiltrados.map((producto) => (
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
