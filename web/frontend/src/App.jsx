import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import Routes from './Routes';

export default function App() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get('shop');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  console.log('🛍️ Shop from URL:', shop);
  console.log('🔍 All URL params:', Object.fromEntries(searchParams));

  useEffect(() => {
    if (!shop) {
      console.warn('No shop detected in URL. Redirecting to auth...');
      // Don't redirect immediately, let's see what we have
      console.log('Current URL:', window.location.href);
      // Uncomment below line if you want to redirect
      // window.location.assign('/api/auth');
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Starting API call to:', `/api/products?shop=${shop}`);
      
      try {
        // Remove the hardcoded access token - this should come from your backend
        const response = await fetch(`/api/products?shop=${shop}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Don't include access token here - backend should handle this
          },
          credentials: 'include',
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response not OK:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Raw API response:', data);
        
        // Handle different response structures
        let productList = [];
        if (data.products) {
          productList = data.products;
        } else if (Array.isArray(data)) {
          productList = data;
        } else if (data.data && data.data.products) {
          productList = data.data.products.edges || data.data.products;
        }
        
        console.log('📦 Processed products:', productList);
        setProducts(productList);
        
      } catch (error) {
        console.error('❌ Fetch error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [shop]);

  return (
    <PolarisProvider i18n={en}>
      <div style={{ padding: '20px' }}>
        <h1>Shopify App Debug</h1>
        
        <div style={{ background: '#f5f5f5', padding: '15px', marginBottom: '20px' }}>
          <h3>Debug Info:</h3>
          <p><strong>Shop:</strong> {shop || 'Not found'}</p>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>Status:</strong> {loading ? 'Loading...' : error ? 'Error' : 'Ready'}</p>
          <p><strong>Products Count:</strong> {products.length}</p>
          {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
        </div>

        {/* Test API endpoint button */}
        <button 
          onClick={() => {
            console.log('🧪 Testing API endpoint...');
            fetch('/api/health')
              .then(r => r.json())
              .then(d => console.log('Health check:', d))
              .catch(e => console.error('Health check failed:', e));
          }}
          style={{ marginBottom: '20px', padding: '10px' }}
        >
          Test API Health
        </button>

        {products.length > 0 && (
          <div>
            <h3>Products ({products.length} found):</h3>
            {products.slice(0, 5).map((product, index) => (
              <div key={index} style={{ 
                border: '1px solid #ccc', 
                padding: '10px', 
                margin: '10px 0',
                background: '#fff'
              }}>
                <strong>
                  {product.node?.title || product.title || 'No Title'}
                </strong>
                <br />
                <span style={{ color: '#666' }}>
                  Handle: {product.node?.handle || product.handle || 'No Handle'}
                </span>
                <br />
                <small style={{ color: '#999' }}>
                  ID: {product.node?.id || product.id || 'No ID'}
                </small>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && !error && (
          <div style={{ background: '#fff3cd', padding: '15px', border: '1px solid #ffeaa7' }}>
            <p>No products found. Check:</p>
            <ul>
              <li>Is your backend API running?</li>
              <li>Is the /api/products endpoint working?</li>
              <li>Are there products in your Shopify store?</li>
              <li>Check browser console for API call details</li>
            </ul>
          </div>
        )}
      </div>
      <Routes />
    </PolarisProvider>
  );
}