import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/martuargento/Alebourg/refs/heads/main/public/productosalebourg.json')
      .then(res => res.json())
      .then(data => {
        const categoriasMap = {};
        
        data.forEach(producto => {
          const categoria = producto.categoria.trim();
          if (categoria) {
            categoriasMap[categoria] = (categoriasMap[categoria] || 0) + 1;
          }
        });

        const categoriasArray = Object.entries(categoriasMap)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        setCategorias(categoriasArray);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar categorías", err);
        setLoading(false);
      });
  }, []);

  const formatCategoryForURL = (categoryName) => {
    return categoryName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[\/&]/g, '-')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  if (loading) return <div>Cargando categorías...</div>;

  return (
    <div className="categorias-container" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px' }}>
      <h4 className="mb-4">Categorías</h4>
      <ul className="list-unstyled">
        {categorias.map((categoria, index) => (
          <li key={index} className="mb-2">
            <Link 
              to={`/categoria/${formatCategoryForURL(categoria.nombre)}`}
              className="text-decoration-none d-flex justify-content-between align-items-center categoria-link"
              style={{ color: '#333', padding: '8px 12px', borderRadius: '4px', transition: 'all 0.3s' }}
            >
              <span>{categoria.nombre}</span>
              <span className="badge bg-primary rounded-pill">{categoria.cantidad}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categorias;