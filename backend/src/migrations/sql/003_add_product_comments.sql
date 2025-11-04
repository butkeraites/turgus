-- Add product comments table
-- Migration: 003_add_product_comments
-- Description: Add the missing product_comments table for buyer questions and seller responses

-- Product comments table (buyer questions and seller responses)
CREATE TABLE IF NOT EXISTS product_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    author_id UUID NOT NULL, -- Can be buyer_id or seller_id
    author_type VARCHAR(10) NOT NULL CHECK (author_type IN ('buyer', 'seller')),
    parent_comment_id UUID REFERENCES product_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product comments indexes
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_author_id ON product_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_author_type ON product_comments(author_type);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent_comment_id ON product_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_comments_is_moderated ON product_comments(is_moderated);

-- Apply updated_at trigger
CREATE TRIGGER update_product_comments_updated_at 
    BEFORE UPDATE ON product_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();