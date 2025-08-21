import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { BACKEND_URL } from '../config';
import { clearCache } from '../services/apiService';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const manejarLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuario, password })
      });
      if (!res.ok) {
        throw new Error('Credenciales inválidas');
      }
      const data = await res.json();
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('logueado', 'true');
      localStorage.setItem('esAdmin', 'true');
      Swal.fire({
        title: '¡Éxito!',
        text: 'Has iniciado sesión correctamente',
        icon: 'success',
        background: '#1e1e1e',
        color: '#fff',
        confirmButtonColor: '#3085d6'
      });
      try { clearCache(); } catch (_) {}
      navigate('/admin/precios');
    } catch (err) {
      localStorage.removeItem('authToken');
      localStorage.setItem('esAdmin', 'false');
      localStorage.removeItem('logueado');
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
          <label>Email</label>
          <input
            type="email"
            className="form-control inputForEstilos"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            placeholder="Ingresa tu email"
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
