import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiHelpers } from '../../../shared/src/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Attempting login...');

    try {
      const res = await api.post('/api/auth/login', { email, password });
      console.log('Login response:', res.data);

      if (res.data?.token) {
        apiHelpers.setToken(res.data.token);
        const user = res.data.user;
        localStorage.setItem('role', user.role);
        localStorage.setItem('customerId', user.customerId);
        

        console.log('🔐 Token and user info stored in localStorage');
        window.location.href = '/support';
      } else {
        alert('Login failed: No token received');
      }
    } catch (err) {
      console.error('Login error:', err?.response?.data || err.message);
      alert('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ padding: '2rem' }}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <br />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
