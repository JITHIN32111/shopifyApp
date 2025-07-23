import React from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import Routes from './Routes';

export default function App() {
  const shopify = useAppBridge(); // returns global shopify object

  // Example of using toast
  const handleClick = () => {
    shopify.toast.show('✅ Hello from App Bridge v4!');
  };

  return (
    <PolarisProvider i18n={en}>
      <Routes />
    </PolarisProvider>
  );
}
