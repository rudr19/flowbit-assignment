import { useEffect, useState } from 'react';
import { getToken } from '../../../shared/src/auth';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      setIsAuthenticated(!!token);
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  return { isAuthenticated };
};

export default useAuth;
