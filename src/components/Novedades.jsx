// Novedades.jsx
import React from 'react';
import ProductosLista from './ProductosLista';

const Novedades = () => {
  return (
    <div className="container">
      <h4>Novedades</h4>
      <ProductosLista category="novedades" />
    </div>
  );
};

export default Novedades;
