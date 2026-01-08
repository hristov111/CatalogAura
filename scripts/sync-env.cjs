#!/usr/bin/env node

/**
 * Sync .env values to Angular environment files
 * This script reads SUPABASE_URL and SUPABASE_ANON_KEY from .env
 * and updates the Angular environment.ts files
 */

const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse .env file
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    envVars[key.trim()] = value.replace(/^["']|["']$/g, ''); // Remove quotes
  }
});

// Get Supabase values
const supabaseUrl = envVars.SUPABASE_URL;
const supabaseAnonKey = envVars.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_ANON_KEY not found in .env file');
  console.log('   Please make sure your .env file contains:');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Found Supabase credentials in .env');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

// Get API URLs from .env (with defaults)
const apiUrl = envVars.API_URL || 'http://localhost:3000/api';
const authUrl = envVars.AUTH_URL || 'http://localhost:8000';

// Create environment file content
const createEnvContent = (production) => `export const environment = {
  production: ${production},
  
  // Backend API URLs
  apiUrl: '${production ? (envVars.API_URL || 'https://your-production-domain.com/api') : apiUrl}',
  authUrl: '${production ? (envVars.AUTH_URL || 'https://your-production-domain.com') : authUrl}',
  
  // Supabase Configuration
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}'
  },
  
  // AI Chat Configuration
  chat: {
    maxMessageLength: 5000,
    autoScroll: true,
    showTimestamps: true,
    tokenRefreshBuffer: 5 * 60 * 1000, // 5 minutes in milliseconds
    monitoringInterval: 60000, // 60 seconds
  },
  
  // JWT Auth Configuration
  jwt: {
    defaultExpiryHours: 24,        // Default token expiry
    storageKey: 'jwt_token',       // LocalStorage key
  },
};
`;

// Update environment.ts (development)
const envDevPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.writeFileSync(envDevPath, createEnvContent(false));
console.log('✅ Updated src/environments/environment.ts');

// Update environment.prod.ts (production)
const envProdPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(envProdPath, createEnvContent(true));
console.log('✅ Updated src/environments/environment.prod.ts');

console.log('\n🎉 Environment files synced successfully!');
console.log('   ✅ Supabase credentials from .env');
console.log('   ✅ API URLs configured');
console.log('   ✅ Chat configuration added');
console.log('   ✅ JWT auth configuration added\n');

