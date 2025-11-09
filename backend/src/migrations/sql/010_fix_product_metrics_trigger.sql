-- Migration: 010_fix_product_metrics_trigger
-- Description: Fix the trigger on product_metrics table to use last_updated instead of updated_at

-- Drop the incorrect trigger if it exists
DROP TRIGGER IF EXISTS update_product_metrics_updated_at ON product_metrics;

-- Create the correct function for updating last_updated
CREATE OR REPLACE FUNCTION update_product_metrics_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the correct trigger
DROP TRIGGER IF EXISTS update_product_metrics_last_updated ON product_metrics;
CREATE TRIGGER update_product_metrics_last_updated
    BEFORE UPDATE ON product_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_product_metrics_last_updated();

