import React from 'react';
import ProductosLista from './ProductosLista';

const Home = () => {
  return (
    <div className="container">
      <h1>Todos los productos</h1>
      <ProductosLista/>
    </div>
  );
};

export default Home;
