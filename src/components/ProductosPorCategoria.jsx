// src/components/ProductosPorCategoria.jsx
// Componente simplificado ya que no necesita Categorias
import React from 'react';
import { useParams } from 'react-router-dom';
import ProductosLista from './ProductosLista';
import { Row, Col } from 'react-bootstrap';

const ProductosPorCategoria = () => {
  const { nombreCategoria } = useParams();

  return (
    <div className="container mt-4">
      <Row className="justify-content-center">
        <Col>
          <h4 className="text-white titulosprincipales mb-4">{nombreCategoria.toUpperCase()}</h4>
          <ProductosLista categoria={nombreCategoria} />
        </Col>
      </Row>
    </div>
  );
};

export default ProductosPorCategoria;