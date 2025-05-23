import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white mt-5 py-4">
      <Container className="text-center">
        <p className="mb-0">&copy; {new Date().getFullYear()} Alebourg. Todos los derechos reservados.</p>
      </Container>
    </footer>
  );
};

export default Footer;
