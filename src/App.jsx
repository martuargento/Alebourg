// App.jsx
import { Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/Header';
import Home from './components/Home';
import Novedades from './components/Novedades';
import VerPedido from './components/VerPedido';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/novedades" element={<Novedades />} />
        <Route path="/verpedido" element={<VerPedido />} />
      </Routes>
      <Footer/>
    </>
  );
}

export default App;
