-- Add available_after column to products table
-- This indicates when a product will be available for purchase
-- If not set by seller, it defaults to the product creation date

ALTER TABLE products 
ADD COLUMN available_after TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Set existing products' available_after to their created_at date
UPDATE products 
SET available_after = created_at 
WHERE available_after IS NULL;

-- Create index for performance when filtering by availability
CREATE INDEX idx_products_available_after ON products(available_after);

-- Success message
SELECT 'Added available_after column to products table' as message;
