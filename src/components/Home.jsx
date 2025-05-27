// src/components/Home.jsx
import React from 'react';
import ProductosLista from './ProductosLista';
import Categorias from './Categorias';
import { Row, Col } from 'react-bootstrap';

const Home = () => {
  return (
    <div className="container mt-4">
      <Row>
        <Col md={3}>
          <Categorias />
        </Col>
        <Col md={9}>
          <h4 className="text-white ms-2 titulosprincipales" style={{ marginTop: 20 }}>Todos los productos</h4>
          <ProductosLista />
        </Col>
      </Row>
    </div>
  );
};

export default Home;