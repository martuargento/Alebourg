import React from 'react';
import ProductosLista from './ProductosLista';

const Home = () => {
  return (
    <div className="container">
      <h4 className="text-muted ms- titulosprincipales">Todos los productos</h4>
      <ProductosLista/>
    </div>
  );
};

export default Home;
