import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, Card } from 'react-bootstrap';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState('0');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/martuargento/Alebourg/main/public/productosalebourgactulizados.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('Datos crudos de la API:', data); // Debugging
        
        if (!Array.isArray(data)) {
          throw new Error('La respuesta no es un array');
        }

        const categoriasMap = {};
        
        data.forEach((producto, index) => {
          if (!producto.categoria) {
            console.warn(`Producto sin categoría en índice ${index}:`, producto);
            return;
          }
          
          const categoria = producto.categoria.trim();
          if (categoria) {
            categoriasMap[categoria] = (categoriasMap[categoria] || 0) + 1;
          }
        });

        console.log('Categorías mapeadas:', categoriasMap); // Debugging
        
        const categoriasArray = Object.entries(categoriasMap)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        setCategorias(categoriasArray);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching categorías:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  const formatCategoryForURL = (categoryName) => {
    return categoryName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[\/&]/g, '-')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  if (loading) return <div>Cargando categorías...</div>;
  
  if (error) return <div className="text-danger">Error: {error}</div>;
  
  if (categorias.length === 0) return <div>No se encontraron categorías</div>;

  return (
    <Accordion activeKey={activeKey} onSelect={(e) => setActiveKey(e === activeKey ? null : e)}>
      <Card className="shadow-sm">
        <Accordion.Item eventKey="0">
          <Accordion.Header as={Card.Header} className="categorias-header">
            <h5 className="mb-0">Categorías</h5>
          </Accordion.Header>
          
          <Accordion.Collapse eventKey="0">
            <Card.Body className="p-2">
              <div className="categorias-list" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {categorias.map((categoria, index) => (
                  <Link 
                    key={index}
                    to={`/categoria/${formatCategoryForURL(categoria.nombre)}`}
                    className="d-flex justify-content-between align-items-center py-2 px-3 text-decoration-none text-dark categoria-item"
                    onClick={() => setActiveKey(null)}
                  >
                    <span>{categoria.nombre}</span>
                    <span className="badge bg-primary rounded-pill">{categoria.cantidad}</span>
                  </Link>
                ))}
              </div>
            </Card.Body>
          </Accordion.Collapse>
        </Accordion.Item>
      </Card>
    </Accordion>
  );
};

export default Categorias;