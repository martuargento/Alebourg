// src/components/Home.jsx
import React from 'react';
import ProductosLista from './ProductosLista';
import { Row, Col } from 'react-bootstrap';

const Home = () => {
  return (
    <div className="container mt-4">
      <Row className="justify-content-center">
        <Col>
          <h4 className="text-white titulosprincipales mb-4">Todos los productos</h4>
          <ProductosLista />
        </Col>
      </Row>
    </div>
  );
};

export default Home;