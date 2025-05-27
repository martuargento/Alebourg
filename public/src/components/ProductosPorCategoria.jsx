// src/components/ProductosPorCategoria.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import ProductosLista from './ProductosLista';
import Categorias from './Categorias';
import { Row, Col } from 'react-bootstrap';

const ProductosPorCategoria = () => {
  const { nombreCategoria } = useParams();

  return (
    <div className="container mt-4">
      <Row>
        <Col md={3}>
          <Categorias />
        </Col>
        <Col md={9}>
          <h4 className="text-white ms-2 titulosprincipales">{nombreCategoria.toUpperCase()}</h4>
          <ProductosLista categoria={nombreCategoria} />
        </Col>
      </Row>
    </div>
  );
};

export default ProductosPorCategoria;