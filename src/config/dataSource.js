/**
 * Data Source Configuration
 *
 * Controls whether the app uses localStorage (development) or API (production)
 * When migrating to backend, update this config and hooks will automatically use API
 *
 * Usage:
 *   import { DATA_SOURCE } from 'config/dataSource';
 *   if (DATA_SOURCE === 'localStorage') { ... }
 */

export const DATA_SOURCE = "localStorage"; // 'localStorage' | 'api'

// Future API configuration (to be populated when migrating)
export const API_CONFIG = {
  endpoint: process.env.REACT_APP_API_URL || "http://localhost:4000/graphql",
  headers: {
    "Content-Type": "application/json",
    // Authorization header will be added when implemented
  },
};
