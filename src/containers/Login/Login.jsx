import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKonamiCode } from '@/hooks/useKonamiCode';
import Header from '@/containers/Header/Header';
import './Login.scss';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle Konami Code
  useKonamiCode(async () => {
    setMessage('You shall pass.');
    const success = await signIn();
    if (success) {
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 500);
    } else {
      setMessage('❌ You shall not pass.');
    }
  });

  return (
    <div className="login-page">
      <Header />
      <div className="login-container">
        <div className="login-box">
          <h1>The Doors of Durin</h1>
          <p className="hint">Lord of Moria. Speak, friend, and enter.</p>
          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
