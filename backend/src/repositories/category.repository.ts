import { BaseRepository } from './base'
import { ICategoryRepository } from './interfaces'
import { Category } from '../types/database'

export class CategoryRepository extends BaseRepository implements ICategoryRepository {
  
  async findAll(): Promise<Category[]> {
    const query = `
      SELECT id, name, name_en, name_pt, created_at
      FROM categories
      ORDER BY name
    `
    return this.query<Category>(query)
  }

  async findCategoryById(id: string): Promise<Category | null> {
    const query = `
      SELECT id, name, name_en, name_pt, created_at
      FROM categories
      WHERE id = $1
    `
    return this.queryOne<Category>(query, [id])
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) return []
    
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ')
    const query = `
      SELECT id, name, name_en, name_pt, created_at
      FROM categories
      WHERE id IN (${placeholders})
      ORDER BY name
    `
    return this.query<Category>(query, ids)
  }

  async findByName(name: string): Promise<Category | null> {
    const query = `
      SELECT id, name, name_en, name_pt, created_at
      FROM categories
      WHERE name = $1 OR name_en = $1 OR name_pt = $1
    `
    return this.queryOne<Category>(query, [name])
  }
}