import React, { useMemo } from 'react';
import  Provider  from '@shopify/app-bridge-react';
import { useLocation } from 'react-router-dom';

export const AppBridgeProvider = ({ children }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shop = searchParams.get('shop');

  const config = useMemo(() => {
    return {
      apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
      host: searchParams.get('host'),
      forceRedirect: true,
    };
  }, [location.search]);

  if (!shop) return <div>Missing shop parameter</div>;

  return <Provider config={config}>{children}</Provider>;
};
