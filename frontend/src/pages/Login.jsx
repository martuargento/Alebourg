import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { loginSchema } from '../utils/validaciones';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const manejarLogin = async (values) => {
    setEnviando(true);
    try {
      await login(values);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Has iniciado sesión correctamente',
        icon: 'success',
        background: '#1e1e1e',
        color: '#fff',
        confirmButtonColor: '#3085d6',
      });
      navigate('/admin/precios');
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || error.message || 'No se pudo iniciar sesión.',
        icon: 'error',
        background: '#1e1e1e',
        color: '#fff',
        confirmButtonColor: '#d33',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h3>Iniciar sesión</h3>
      <form onSubmit={handleSubmit(manejarLogin)}>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control inputForEstilos"
            {...register('email')}
            placeholder="Ingresa tu email"
          />
          {errors.email && <div className="text-danger">{errors.email.message}</div>}
        </div>

        <div className="mb-3">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control inputForEstilos"
            {...register('password')}
          />
          {errors.password && <div className="text-danger">{errors.password.message}</div>}
        </div>

        <button type="submit" className="btn btn-primary w-100 iniciarSesionEstilos" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
