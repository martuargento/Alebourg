// Novedades.jsx
import React from 'react';
import ProductosLista from './ProductosLista';

const Novedades = () => {
  return (
    <div className="container">
      <h4 className="text-muted ms-4 titulosprincipales">Novedades</h4>
      <ProductosLista categoria="novedades" /> {/* <- esta es la línea corregida */}
    </div>
  );
};

export default Novedades;
