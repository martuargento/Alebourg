// src/components/ProductosPorCategoria.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductosLista from './ProductosLista';
import { Row, Col } from 'react-bootstrap';
import { getProductos } from '../services/apiService';
import { categorySlugEquals, slugifyCategory } from '../utils/slug';

const ProductosPorCategoria = () => {
  const { nombreCategoria } = useParams();
  const [categoriaFormateada, setCategoriaFormateada] = useState('');

  useEffect(() => {
    const obtenerCategoria = async () => {
      try {
        const data = await getProductos();
        
        const producto = data.find(p => categorySlugEquals(p.categoria, nombreCategoria));

        if (producto) {
          // Separar palabras cuando hay mayúsculas
          setCategoriaFormateada(producto.categoria);
        }
      } catch (error) {
        console.error('Error al obtener la categoría:', error);
      }
    };

    obtenerCategoria();
  }, [nombreCategoria]);

  return (
    <div className="container mt-4">
      <Row className="justify-content-center">
        <Col>
          <h4 className="text-white titulosprincipales mb-4">
            {categoriaFormateada || nombreCategoria}
          </h4>
          <ProductosLista categoria={nombreCategoria} />
        </Col>
      </Row>
    </div>
  );
};

export default ProductosPorCategoria;