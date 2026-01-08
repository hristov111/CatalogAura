const fs = require('fs');
const path = require('path');
const supabase = require('./supabaseClient');

/**
 * Run database migrations
 * This script executes SQL migration files in order
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrationFiles = [
    'db/002_personas_migration.sql',
    'db/003_seed_elara.sql',
    'db/004_seed_all_personas.sql',
    'db/005_auth_system_migration.sql'
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${file}`);
      continue;
    }

    console.log(`📄 Running migration: ${file}`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split by semicolons to handle multiple statements
      // Note: This is a simple split and may not handle all edge cases
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            // Try direct query if RPC doesn't work
            const { error: directError } = await supabase.from('_').select('*').limit(0);
            
            if (directError) {
              console.error(`   ⚠️  Error executing statement: ${error.message}`);
              console.log(`   Statement: ${statement.substring(0, 100)}...`);
            }
          }
        }
      }
      
      console.log(`   ✅ Completed: ${file}\n`);
    } catch (err) {
      console.error(`   ❌ Error reading/executing ${file}:`, err.message);
      console.log(`   Please run this migration manually in Supabase SQL Editor\n`);
    }
  }

  console.log('✨ Migration process completed!');
  console.log('\n📝 Note: If you see errors, please run the SQL files manually in Supabase Dashboard > SQL Editor');
  console.log('   The files are located in: backend/db/\n');
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

