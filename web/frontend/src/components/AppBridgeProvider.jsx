// src/components/AppBridgeProvider.jsx
import { Provider } from '@shopify/app-bridge-react';
import { useNavigate } from 'react-router-dom';

export function AppBridgeProvider({ children, config }) {
  const navigate = useNavigate();

  // App Bridge configuration
  const appBridgeConfig = {
    apiKey: config.apiKey,
    host: config.host,
    forceRedirect: config.forceRedirect,
  };

  return (
    <Provider config={appBridgeConfig} router={{ navigate }}>
      {children}
    </Provider>
  );
}