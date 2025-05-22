import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';


// import ProductCard from './ProductCard';

const ProductList = ({ category = null }) => 
{

  const [productos,setProductos]=useState([])

  const [loading,setLoading]=useState(true)

  useEffect(() => {
    fetch('https://682f69eef504aa3c70f3f01a.mockapi.io/productos')
        .then(res => res.json())
        .then(data => {
        setProductos(data)  
        setLoading(false)
        })
        .catch(err => { 
        console.error("Error de carga de API", err)
        setLoading(false)
        })
    }, [])


  return (
   <Container className="mt-4">
    <h1>Productos de Alebourg</h1>
    <Row>
      {productos.map(producto=>(
        <Col key={producto.id} md={4}>
          <Card className="m-2">
          <Card.Img src={producto.imagen}/>
            <Card.Body>
              <Card.Title>{producto.name}</Card.Title>
                <Card.Text>
                  <strong>Precio: {producto.precio || 'N/A'} </strong>
                </Card.Text>

            </Card.Body>
          </Card>
        </Col>
      
      
      ))}

    </Row>
   </Container>

  )
  }

  export default ProductList;