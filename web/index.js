// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import timerRoutes from './routes/timerRoutes.js';
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import dotenv from 'dotenv';

import connectDB from './db/connection.js';
dotenv.config();
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/dist`;

const app = express();
connectDB();
// IMPORTANT: Move this middleware to be applied to ALL routes, not just API routes
app.use((req, res, next) => {
  // Add multiple headers to bypass ngrok warning
  res.setHeader('ngrok-skip-browser-warning', 'true');
  res.setHeader('ngrok-skip-browser-warning', 'any');
  next();
});

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js
app.use("/api/*", shopify.validateAuthenticatedSession());


app.use(express.json());
app.use("/api/counter", timerRoutes);

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});


app.get("/api/products", async (req, res) => {
  console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM");
  
  const shop = req.query.shop;
console.log(shop);

  if (!shop) return res.status(400).send("Missing shop parameter");

  const session = await shopify.sessionStorage.loadOfflineSession(shop);
  if (!session) return res.status(401).send("Unauthorized");

  const client = new shopify.api.clients.Graphql({
    session,
  });

  const query = `{
    products(first: 5) {
      edges {
        node {
          id
          handle
        }
      }
    }
  }`;

  try {
    const response = await client.query({ data: { query } });
    res.status(200).json(response.body.data.products.edges);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).send("Error fetching products");
  }
});


app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});
app.get('/api/debug-session', async (req, res) => {
  console.log("((((((((((((((((((((((((((((((((((((((((((((((");
  
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).json({ error: 'Missing shop query param' });
  }

  try {
    const session = await shopify.api.session.storage.findByShop(shop);

    if (!session) {
      return res.status(404).json({ error: 'No session found for this shop' });
    }

    console.log("✅ Access token for shop:", shop, session.accessToken);

    res.status(200).json({
      shop: session.shop,
      accessToken: session.accessToken,
      scope: session.scope,
      isOnline: session.isOnline,
    });
  } catch (err) {
    console.error("❌ Error retrieving session:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

// Handle app routing with proper shop parameter handling
app.use("/*", async (req, res, next) => {
  // Skip shop validation for auth routes, API routes, and static assets
  if (req.path.startsWith('/api/') || 
      req.path === shopify.config.auth.path || 
      req.path === shopify.config.auth.callbackPath ||
      req.path === shopify.config.webhooks.path ||
      req.path.includes('.') || // Skip static files
      req.path.startsWith('/assets/')) {
    return next();
  }
  
  console.log("Processing route:", req.path, "Query:", req.query);
  
  // Try to extract shop from various sources
  let shop = req.query.shop;
  
  if (!shop) {
    // Try to extract from headers (embedded app)
    shop = req.get('x-shopify-shop-domain') || req.get('x-shop-domain');
  }
  
  if (!shop) {
    // Try to extract from referrer URL
    const referer = req.get('referer');
    if (referer) {
      // First try to extract shop parameter from referrer query string
      const refererUrl = new URL(referer);
      const shopFromRefererQuery = refererUrl.searchParams.get('shop');
      if (shopFromRefererQuery) {
        shop = shopFromRefererQuery;
        // Also extract other Shopify parameters from referrer
        const host = refererUrl.searchParams.get('host');
        const embedded = refererUrl.searchParams.get('embedded');
        const locale = refererUrl.searchParams.get('locale');
        const session = refererUrl.searchParams.get('session');
        const timestamp = refererUrl.searchParams.get('timestamp');
        const hmac = refererUrl.searchParams.get('hmac');
        const id_token = refererUrl.searchParams.get('id_token');
        
        // Add all available Shopify parameters to current request
        if (host) req.query.host = host;
        if (embedded) req.query.embedded = embedded;
        if (locale) req.query.locale = locale;
        if (session) req.query.session = session;
        if (timestamp) req.query.timestamp = timestamp;
        if (hmac) req.query.hmac = hmac;
        if (id_token) req.query.id_token = id_token;
      } else {
        // Fallback: extract from domain pattern
        const shopMatch = referer.match(/https?:\/\/([^.]+\.myshopify\.com)/);
        if (shopMatch) {
          shop = shopMatch[1];
        }
      }
    }
  }
  
  if (shop) {
    // Ensure shop is in query params for Shopify middleware
    req.query.shop = shop;
    console.log("SHOP found:", shop, "Query params:", Object.keys(req.query));
    return shopify.ensureInstalledOnShop()(req, res, next);
  } else {
    // No shop found - this might be a direct access or development scenario
    console.log("No shop parameter found. Request details:", {
      path: req.path,
      query: req.query,
      headers: {
        referer: req.get('referer'),
        'user-agent': req.get('user-agent'),
        'x-shopify-shop-domain': req.get('x-shopify-shop-domain')
      }
    });
    
    // Return a simple page asking for shop parameter or redirect to Shopify Partner dashboard
    return res.status(400).send(`
      <html>
        <head>
          <title>Shopify App</title>
          <script>
            // If we're in an iframe (embedded app), try to reload the parent
            if (window.parent !== window) {
              window.parent.location.reload();
            }
          </script>
        </head>
        <body>
          <h1>Shopify App</h1>
          <p>This app needs to be accessed through Shopify.</p>
          <p>Please install and access this app through your Shopify admin panel.</p>
          <p>If you're a developer, make sure to access the app with a shop parameter: <code>?shop=your-store.myshopify.com</code></p>
        </body>
      </html>
    `);
  }
}, async (req, res, next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});


app.listen(PORT, () => {
  console.log(`🚀 Backend is running on http://localhost:${PORT}`);
});
