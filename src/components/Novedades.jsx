// Novedades.jsx
import React from 'react';
import ProductosLista from './ProductosLista';

const Novedades = () => {
  return (
    <div className="container">
      <h1>Novedades</h1>
      <ProductosLista category="novedades" />
    </div>
  );
};

export default Novedades;
