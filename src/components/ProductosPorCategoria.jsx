// src/components/ProductosPorCategoria.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductosLista from './ProductosLista';
import { Row, Col } from 'react-bootstrap';
import { getProductos } from '../services/apiService';

const ProductosPorCategoria = () => {
  const { nombreCategoria } = useParams();
  const [categoriaFormateada, setCategoriaFormateada] = useState('');

  useEffect(() => {
    const obtenerCategoria = async () => {
      try {
        const data = await getProductos();
        
        const producto = data.find(p => {
          const categoriaURL = p.categoria.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '')
            .replace(/[\/&]/g, '');
          return categoriaURL === nombreCategoria;
        });

        if (producto) {
          // Separar palabras cuando hay mayúsculas
          const categoriaConEspacios = producto.categoria.trim().replace(/([A-Z])/g, ' $1').trim();
          setCategoriaFormateada(categoriaConEspacios);
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