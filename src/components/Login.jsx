import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const manejarLogin = (e) => {
    e.preventDefault();

    if (usuario === 'admin' && password === '1234') {
      // Guardamos estado de login en localStorage
      localStorage.setItem('logueado', 'true');
      Swal.fire({
      title: '¡Éxito!',
      text: 'Has iniciado sesión correctamente',
      icon: 'success',
      background: '#1e1e1e',
      color: '#fff',
      confirmButtonColor: '#3085d6'
    });
      navigate('/'); // redirigimos al home
    } else {
      Swal.fire({
      title: 'Error',
      text: 'Usuario o contraseña incorrectos',
      icon: 'error',
      background: '#1e1e1e',
      color: '#fff',
      confirmButtonColor: '#d33'  
    });
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h3>Iniciar sesión</h3>
      <form onSubmit={manejarLogin}>
        <div className="mb-3">
          <label>Usuario</label>
          <input
            type="text"
            className="form-control inputForEstilos"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control inputForEstilos"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 iniciarSesionEstilos">
          Iniciar sesión
        </button>
      </form>
    </div>
  );
};

export default Login;
