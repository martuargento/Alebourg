import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, Card } from 'react-bootstrap';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState('0'); // Estado para controlar apertura/cierre

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/martuargento/Alebourg/main/public/productosalebourgactulizados.json')
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