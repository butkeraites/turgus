-- Product Interests Queue System
-- Migration: 009_product_interests_queue
-- Description: Create product interests table to track interest queue for products
-- This allows multiple buyers to show interest in a product with queue positions

-- Create product_interests table to track interest queue
CREATE TABLE product_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyer_accounts(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- Position in the queue (1 = first, 2 = second, etc.)
    want_list_id UUID REFERENCES want_lists(id) ON DELETE SET NULL, -- Link to the buyer's want list
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, buyer_id), -- A buyer can only be in the queue once per product
    UNIQUE(product_id, position) -- Each position in queue is unique per product
);

-- Create indexes for performance
CREATE INDEX idx_product_interests_product_id ON product_interests(product_id);
CREATE INDEX idx_product_interests_buyer_id ON product_interests(buyer_id);
CREATE INDEX idx_product_interests_position ON product_interests(product_id, position);
CREATE INDEX idx_product_interests_want_list_id ON product_interests(want_list_id);

-- Function to get next position in queue for a product
CREATE OR REPLACE FUNCTION get_next_queue_position(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_position INTEGER;
BEGIN
    SELECT COALESCE(MAX(position), 0) INTO max_position
    FROM product_interests
    WHERE product_id = p_product_id;
    
    RETURN max_position + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically promote next buyer when a want list is cancelled or completed
CREATE OR REPLACE FUNCTION promote_next_buyer(p_product_id UUID, p_removed_want_list_id UUID)
RETURNS UUID AS $$
DECLARE
    next_interest RECORD;
    next_want_list_id UUID;
    remaining_count INTEGER;
BEGIN
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
    UPDATE products
    SET status = 'reserved', updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;
    
    RETURN next_interest.want_list_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically add to interest queue when product is added to want list
CREATE OR REPLACE FUNCTION add_to_interest_queue()
RETURNS TRIGGER AS $$
DECLARE
    v_position INTEGER;
    v_buyer_id UUID;
BEGIN
    -- Get buyer_id from want_list
    SELECT buyer_id INTO v_buyer_id
    FROM want_lists
    WHERE id = NEW.want_list_id;
    
    -- Get next position in queue
    SELECT get_next_queue_position(NEW.product_id) INTO v_position;
    
    -- Add to interest queue
    INSERT INTO product_interests (product_id, buyer_id, position, want_list_id)
    VALUES (NEW.product_id, v_buyer_id, v_position, NEW.want_list_id)
    ON CONFLICT (product_id, buyer_id) DO NOTHING;
    
    -- If this is the first person in queue (position 1), mark product as reserved
    IF v_position = 1 THEN
        UPDATE products
        SET status = 'reserved', updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.product_id AND status = 'available';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add to interest queue when item is added to want list
CREATE TRIGGER trigger_add_to_interest_queue
    AFTER INSERT ON want_list_items
    FOR EACH ROW
    EXECUTE FUNCTION add_to_interest_queue();

-- Trigger function to remove from interest queue and promote next buyer
CREATE OR REPLACE FUNCTION remove_from_interest_queue()
RETURNS TRIGGER AS $$
DECLARE
    v_product_id UUID;
    v_want_list_id UUID;
    v_position INTEGER;
BEGIN
    -- Get product_id and want_list_id from OLD (the deleted row)
    v_product_id := OLD.product_id;
    v_want_list_id := OLD.want_list_id;
    
    -- Get position before deleting
    SELECT position INTO v_position
    FROM product_interests
    WHERE product_id = v_product_id
      AND want_list_id = v_want_list_id
    LIMIT 1;
    
    -- Remove from interest queue
    DELETE FROM product_interests
    WHERE product_id = v_product_id
      AND want_list_id = v_want_list_id;
    
    -- If this was position 1, promote next buyer
    IF v_position = 1 THEN
        PERFORM promote_next_buyer(v_product_id, v_want_list_id);
    ELSIF v_position IS NOT NULL THEN
        -- Shift positions up for those after the removed position
        UPDATE product_interests
        SET position = position - 1
        WHERE product_id = v_product_id
          AND position > v_position;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to remove from interest queue when item is removed from want list
CREATE TRIGGER trigger_remove_from_interest_queue
    AFTER DELETE ON want_list_items
    FOR EACH ROW
    EXECUTE FUNCTION remove_from_interest_queue();

-- Trigger function to handle want list cancellation/completion
CREATE OR REPLACE FUNCTION handle_want_list_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- Only process if status changed to cancelled or completed
    IF (OLD.status = 'active' AND NEW.status IN ('cancelled', 'completed')) THEN
        -- For each item in the want list, promote next buyer
        FOR v_item IN
            SELECT product_id
            FROM want_list_items
            WHERE want_list_id = NEW.id
        LOOP
            PERFORM promote_next_buyer(v_item.product_id, NEW.id);
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle want list status changes
CREATE TRIGGER trigger_want_list_status_change
    AFTER UPDATE OF status ON want_lists
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_want_list_status_change();

