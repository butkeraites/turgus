-- Turgus Marketplace Database Schema
-- Based on requirements and design document

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS want_list_items CASCADE;
DROP TABLE IF EXISTS want_lists CASCADE;
DROP TABLE IF EXISTS product_views CASCADE;
DROP TABLE IF EXISTS product_photos CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS buyer_accounts CASCADE;
DROP TABLE IF EXISTS seller_accounts CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS want_list_status CASCADE;

-- Create enum types
CREATE TYPE product_status AS ENUM ('draft', 'available', 'reserved', 'sold');
CREATE TYPE want_list_status AS ENUM ('active', 'completed', 'cancelled');

-- Seller accounts table (predefined seller account)
CREATE TABLE seller_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Buyer accounts table (user-created accounts)
CREATE TABLE buyer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    language VARCHAR(2) DEFAULT 'pt' CHECK (language IN ('pt', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table (predefined categories for products)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES seller_accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    status product_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Product photos table (multiple photos per product)
CREATE TABLE product_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product categories junction table (many-to-many relationship)
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, category_id)
);

-- Product views table (track which products buyers have viewed)
CREATE TABLE product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyer_accounts(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, buyer_id)
);

-- Want lists table (buyer's collection of desired products)
CREATE TABLE want_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES buyer_accounts(id) ON DELETE CASCADE,
    status want_list_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Want list items table (products in a want list)
CREATE TABLE want_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    want_list_id UUID NOT NULL REFERENCES want_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(want_list_id, product_id)
);

-- Create indexes for performance optimization

-- Seller accounts indexes
CREATE INDEX idx_seller_accounts_username ON seller_accounts(username);

-- Buyer accounts indexes
CREATE INDEX idx_buyer_accounts_email ON buyer_accounts(email);
CREATE INDEX idx_buyer_accounts_language ON buyer_accounts(language);

-- Categories indexes
CREATE INDEX idx_categories_name ON categories(name);

-- Products indexes
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_published_at ON products(published_at DESC);
CREATE INDEX idx_products_price ON products(price);

-- Product photos indexes
CREATE INDEX idx_product_photos_product_id ON product_photos(product_id);
CREATE INDEX idx_product_photos_sort_order ON product_photos(product_id, sort_order);

-- Product categories indexes
CREATE INDEX idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX idx_product_categories_category_id ON product_categories(category_id);

-- Product views indexes
CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_buyer_id ON product_views(buyer_id);
CREATE INDEX idx_product_views_viewed_at ON product_views(viewed_at DESC);

-- Want lists indexes
CREATE INDEX idx_want_lists_buyer_id ON want_lists(buyer_id);
CREATE INDEX idx_want_lists_status ON want_lists(status);
CREATE INDEX idx_want_lists_created_at ON want_lists(created_at DESC);

-- Want list items indexes
CREATE INDEX idx_want_list_items_want_list_id ON want_list_items(want_list_id);
CREATE INDEX idx_want_list_items_product_id ON want_list_items(product_id);
CREATE INDEX idx_want_list_items_added_at ON want_list_items(added_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_seller_accounts_updated_at 
    BEFORE UPDATE ON seller_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_accounts_updated_at 
    BEFORE UPDATE ON buyer_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_want_lists_updated_at 
    BEFORE UPDATE ON want_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined seller account (Requirement 13.1, 13.2)
INSERT INTO seller_accounts (username, password_hash) VALUES 
('Bazar dos BUts', '$2a$10$example.hash.for.development.only');

-- Insert predefined categories
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
('Art', 'Art', 'Arte');

-- Success message
SELECT 'Turgus database schema created successfully!' as message;