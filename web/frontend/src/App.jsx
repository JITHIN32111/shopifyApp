// App.jsx
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const shop = queryParams.get('shop');
    const host = queryParams.get('host');

    if (!shop || !host) {
      // Redirect to auth endpoint if not installed or shop is missing
      window.location.assign(`/api/auth?shop=${shop || ''}`);
    }
  }, []);

  return <div>Loading...</div>;
};

export default App;
