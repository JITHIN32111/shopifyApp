import { shopifyApp } from "@shopify/shopify-app-express";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import dotenv from "dotenv";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const shopify = shopifyApp({
  api: {
    apiVersion: "2025-07",
    restResources,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  sessionStorage: new MongoDBSessionStorage(MONGO_URI),
  webhooks: {
    path: "/api/webhooks",
  },
});

export default shopify;
