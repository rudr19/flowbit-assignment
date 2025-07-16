import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiHelpers } from '../../../shared/src/api';

const Sidebar = () => {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const res = await api.get('/api/me/screens');
        console.log('📺 Screens fetched:', res.data);
        setScreens(res.data);
      } catch (error) {
        console.error('Failed to load screens:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScreens();
  }, []);

  return (
    <div style={{ width: '200px', background: '#f5f5f5', padding: '1rem' }}>
      <h3>Navigation</h3>
      {loading ? (
        <p>Loading...</p>
      ) : screens.length > 0 ? (
        screens.map((screen, index) => (
          <div key={index}>
            <Link to={screen.url}>{screen.name || screen.url.replace('/', '') || 'Home'}</Link>
          </div>
        ))
      ) : (
        <p>No screens configured for your tenant.</p>
      )}
      <button onClick={apiHelpers.logout} style={{ marginTop: '1rem' }}>Logout</button>
    </div>
  );
};

export default Sidebar;
