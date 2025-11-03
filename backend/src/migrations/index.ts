import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { query } from '../config/database'

// Migration interface
interface Migration {
  id: string
  filename: string
  sql: string
  executed_at?: Date
}

// Create migrations table if it doesn't exist
const createMigrationsTable = async (): Promise<void> => {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `
  await query(sql)
}

// Get executed migrations from database
const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await query('SELECT id FROM migrations ORDER BY executed_at')
  return result.rows.map((row: any) => row.id)
}

// Get migration files from filesystem
const getMigrationFiles = async (): Promise<Migration[]> => {
  const migrationsDir = join(__dirname, 'sql')
  
  try {
    const files = await readdir(migrationsDir)
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort()
    
    const migrations: Migration[] = []
    
    for (const filename of sqlFiles) {
      const id = filename.replace('.sql', '')
      const filepath = join(migrationsDir, filename)
      const sql = await readFile(filepath, 'utf-8')
      
      migrations.push({
        id,
        filename,
        sql
      })
    }
    
    return migrations
  } catch (error) {
    console.log('No migrations directory found, skipping file-based migrations')
    return []
  }
}

// Execute a single migration
const executeMigration = async (migration: Migration): Promise<void> => {
  console.log(`🔄 Executing migration: ${migration.filename}`)
  
  try {
    // Execute the migration SQL
    await query(migration.sql)
    
    // Record the migration as executed
    await query(
      'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
      [migration.id, migration.filename]
    )
    
    console.log(`✅ Migration completed: ${migration.filename}`)
  } catch (error) {
    console.error(`❌ Migration failed: ${migration.filename}`, error)
    throw error
  }
}

// Run all pending migrations
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🚀 Starting database migrations...')
    
    // Create migrations table
    await createMigrationsTable()
    
    // Get executed and available migrations
    const executedMigrations = await getExecutedMigrations()
    const availableMigrations = await getMigrationFiles()
    
    // Filter pending migrations
    const pendingMigrations = availableMigrations.filter(
      migration => !executedMigrations.includes(migration.id)
    )
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations')
      return
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migrations`)
    
    // Execute pending migrations
    for (const migration of pendingMigrations) {
      await executeMigration(migration)
    }
    
    console.log('✅ All migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration process failed:', error)
    throw error
  }
}

// Rollback last migration (for development)
export const rollbackLastMigration = async (): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, filename FROM migrations ORDER BY executed_at DESC LIMIT 1'
    )
    
    if (result.rows.length === 0) {
      console.log('No migrations to rollback')
      return
    }
    
    const lastMigration = result.rows[0]
    console.log(`🔄 Rolling back migration: ${lastMigration.filename}`)
    
    // Remove from migrations table
    await query('DELETE FROM migrations WHERE id = $1', [lastMigration.id])
    
    console.log(`✅ Rollback completed: ${lastMigration.filename}`)
    console.log('⚠️  Note: You may need to manually undo schema changes')
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  }
}

export default { runMigrations, rollbackLastMigration }