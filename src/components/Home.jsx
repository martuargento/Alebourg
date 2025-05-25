import React from 'react';
import ProductosLista from './ProductosLista';

const Home = () => {
  return (
    <div className="container">
      <h4 className="text-white ms-2 titulosprincipales " style={{ marginTop: 20 }}>Todos los productos</h4>
      <ProductosLista/>
    </div>
  );
};

export default Home;
