-- Migration: 011_fix_promote_next_buyer_for_sold_products
-- Description: Fix promote_next_buyer function to handle sold products correctly

-- Function to automatically promote next buyer when a want list is cancelled or completed
CREATE OR REPLACE FUNCTION promote_next_buyer(p_product_id UUID, p_removed_want_list_id UUID)
RETURNS UUID AS $$
DECLARE
    next_interest RECORD;
    next_want_list_id UUID;
    remaining_count INTEGER;
    product_status VARCHAR(20);
BEGIN
    -- Check product status first - don't promote if product is already sold
    SELECT status INTO product_status
    FROM products
    WHERE id = p_product_id;
    
    IF product_status = 'sold' THEN
        -- Product is already sold, don't promote anyone
        RETURN NULL;
    END IF;
    
    -- Count remaining interests after removal
    SELECT COUNT(*) INTO remaining_count
    FROM product_interests
    WHERE product_id = p_product_id;
    
    IF remaining_count = 0 THEN
        -- No one else in queue, product becomes available again
        UPDATE products
        SET status = 'available', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_product_id AND status = 'reserved';
        
        RETURN NULL;
    END IF;
    
    -- Find the next buyer in queue (lowest position after 1)
    SELECT id, buyer_id, want_list_id, position INTO next_interest
    FROM product_interests
    WHERE product_id = p_product_id
    ORDER BY position ASC
    LIMIT 1;
    
    IF next_interest IS NULL THEN
        -- No one else in queue, product becomes available again
        UPDATE products
        SET status = 'available', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_product_id AND status = 'reserved';
        
        RETURN NULL;
    END IF;
    
    -- If next buyer is not already at position 1, promote them
    IF next_interest.position > 1 THEN
        -- Promote the next buyer to position 1
        UPDATE product_interests
        SET position = 1
        WHERE id = next_interest.id;
        
        -- Shift all other positions down by 1
        UPDATE product_interests
        SET position = position - 1
        WHERE product_id = p_product_id
          AND position > next_interest.position
          AND id != next_interest.id;
    END IF;
    
    -- Update product to remain reserved (now for the next buyer)
    -- Only if product is not already sold
    IF product_status != 'sold' THEN
        UPDATE products
        SET status = 'reserved', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_product_id AND status != 'sold';
    END IF;
    
    RETURN next_interest.want_list_id;
END;
$$ LANGUAGE plpgsql;

