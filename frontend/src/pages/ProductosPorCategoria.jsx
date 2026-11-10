import { useParams } from 'react-router-dom';
import ProductosLista from '../components/ProductosLista';
import { Row, Col } from 'react-bootstrap';
import { sonCategoriasIguales } from '../utils/categoriasUtils';
import { useProductos } from '../hooks/useProductos';

export default function ProductosPorCategoria() {
  const { nombreCategoria } = useParams();
  const { data: productos = [] } = useProductos();
  const categoriaFormateada = productos.find(
    (producto) => sonCategoriasIguales(producto.categoria, nombreCategoria),
  )?.categoria;

  return (
    <div className="container mt-4">
      <Row className="justify-content-center">
        <Col>
          <h4 className="text-white titulosprincipales mb-4">
            {categoriaFormateada || nombreCategoria}
          </h4>
          <ProductosLista categoria={nombreCategoria} />
        </Col>
      </Row>
    </div>
  );
}