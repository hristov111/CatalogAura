export const environment = {
  production: true,
  
  // Backend API URLs
  apiUrl: 'https://your-production-domain.com/api',
  authUrl: 'https://your-production-domain.com',
  
  // Supabase Configuration
  supabase: {
    url: 'https://wgigbvraeojprbndnrmt.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaWdidnJhZW9qcHJibmRucm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjYwNzgsImV4cCI6MjA4MTMwMjA3OH0.ocoXoi_X_MVOIcA5fyp5jwYyl-yHmC7wb8tC9h1O0g4'
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
