// Novedades.jsx
import React from 'react';
import ProductosLista from './ProductosLista';

const Novedades = () => {
  return (
    <div className="container">
      <h4 className="text-white ms-2 titulosprincipales">Novedades</h4>
      <ProductosLista categoria="novedades" /> {/* <- esta es la línea corregida */}
    </div>
  );
};

export default Novedades;
