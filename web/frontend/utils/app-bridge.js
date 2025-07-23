// utils/app-bridge.js
import { createApp } from '@shopify/app-bridge';

export function getAppBridge(shop, host) {
  return createApp({
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY, // or process.env
    host: host,
    forceRedirect: true,
  });
}
