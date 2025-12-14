const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env');
  // We don't exit process here to allow the server to start, but APIs will fail
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;

