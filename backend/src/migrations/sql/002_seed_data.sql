-- Seed Data Migration
-- Migration: 002_seed_data
-- Description: Insert initial data for seller account and categories

-- Insert predefined seller account (Requirement 13.1, 13.2)
-- Password: "paladino0" (hashed with bcrypt)
INSERT INTO seller_accounts (username, password_hash) VALUES 
('Bazar dos BUts', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Insert predefined categories (multilingual support)
INSERT INTO categories (name, name_en, name_pt) VALUES 
('Electronics', 'Electronics', 'Eletrônicos'),
('Clothing', 'Clothing', 'Roupas'),
('Books', 'Books', 'Livros'),
('Home & Garden', 'Home & Garden', 'Casa e Jardim'),
('Sports', 'Sports', 'Esportes'),
('Toys', 'Toys', 'Brinquedos'),
('Beauty', 'Beauty', 'Beleza'),
('Automotive', 'Automotive', 'Automotivo'),
('Music', 'Music', 'Música'),
('Art', 'Art', 'Arte'),
('Collectibles', 'Collectibles', 'Colecionáveis'),
('Jewelry', 'Jewelry', 'Joias'),
('Pet Supplies', 'Pet Supplies', 'Suprimentos para Pets'),
('Office Supplies', 'Office Supplies', 'Material de Escritório'),
('Health & Wellness', 'Health & Wellness', 'Saúde e Bem-estar');