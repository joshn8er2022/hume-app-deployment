import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function RouteHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle malformed admin/seeding URLs
    if (location.pathname.includes('/admin/seeding') && location.pathname !== '/admin/seeding') {
      navigate('/admin/seeding', { replace: true });
    }

    // Handle any URL-encoded characters in paths
    const decodedPath = decodeURIComponent(location.pathname);
    if (decodedPath !== location.pathname) {
      // Clean up common malformed paths
      if (decodedPath.includes('/admin/seeding`')) {
        navigate('/admin/seeding', { replace: true });
      } else if (decodedPath !== location.pathname) {
        navigate(decodedPath, { replace: true });
      }
    }
  }, [location, navigate]);

  return null; // This component doesn't render anything
}