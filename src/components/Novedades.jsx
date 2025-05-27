// src/components/Novedades.jsx
import React from 'react';
import ProductosLista from './ProductosLista';
import Categorias from './Categorias';
import { Row, Col } from 'react-bootstrap';

const Novedades = () => {
  return (
    <div className="container mt-4">
      <Row>
        <Col md={3}>
          <Categorias />
        </Col>
        <Col md={9}>
          <h4 className="text-white ms-2 titulosprincipales">Novedades</h4>
          <ProductosLista categoria="novedades" />
        </Col>
      </Row>
    </div>
  );
};

export default Novedades;