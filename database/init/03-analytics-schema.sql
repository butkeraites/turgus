-- Analytics tables for Turgus Marketplace
-- These tables support the analytics functionality

-- Product metrics table (aggregated metrics per product)
CREATE TABLE product_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    want_list_adds INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id)
);

-- Online sessions table (track active users)
CREATE TABLE online_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES buyer_accounts(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id)
);

-- Sales analytics table (track completed sales)
CREATE TABLE sales_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES seller_accounts(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyer_accounts(id) ON DELETE CASCADE,
    want_list_id UUID NOT NULL REFERENCES want_lists(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    item_count INTEGER NOT NULL CHECK (item_count > 0),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update product_views table to support anonymous tracking
-- Add session_id and other tracking fields
ALTER TABLE product_views 
    DROP CONSTRAINT product_views_buyer_id_fkey,
    ALTER COLUMN buyer_id DROP NOT NULL,
    ADD COLUMN viewer_id UUID REFERENCES buyer_accounts(id) ON DELETE CASCADE,
    ADD COLUMN session_id VARCHAR(255),
    ADD COLUMN ip_address INET,
    ADD COLUMN user_agent TEXT;

-- Drop the old unique constraint and create a new one
ALTER TABLE product_views DROP CONSTRAINT product_views_product_id_buyer_id_key;

-- Update the unique constraint to handle both logged-in and anonymous users
-- We'll allow multiple views from the same session/user but track them all
DROP INDEX IF EXISTS idx_product_views_unique;

-- Create indexes for analytics tables

-- Product metrics indexes
CREATE INDEX idx_product_metrics_product_id ON product_metrics(product_id);
CREATE INDEX idx_product_metrics_total_views ON product_metrics(total_views DESC);
CREATE INDEX idx_product_metrics_want_list_adds ON product_metrics(want_list_adds DESC);
CREATE INDEX idx_product_metrics_last_updated ON product_metrics(last_updated DESC);

-- Online sessions indexes
CREATE INDEX idx_online_sessions_user_id ON online_sessions(user_id);
CREATE INDEX idx_online_sessions_session_id ON online_sessions(session_id);
CREATE INDEX idx_online_sessions_last_activity ON online_sessions(last_activity DESC);
CREATE INDEX idx_online_sessions_is_active ON online_sessions(is_active);

-- Sales analytics indexes
CREATE INDEX idx_sales_analytics_seller_id ON sales_analytics(seller_id);
CREATE INDEX idx_sales_analytics_buyer_id ON sales_analytics(buyer_id);
CREATE INDEX idx_sales_analytics_want_list_id ON sales_analytics(want_list_id);
CREATE INDEX idx_sales_analytics_completed_at ON sales_analytics(completed_at DESC);
CREATE INDEX idx_sales_analytics_total_amount ON sales_analytics(total_amount DESC);

-- Updated product_views indexes
CREATE INDEX idx_product_views_viewer_id ON product_views(viewer_id);
CREATE INDEX idx_product_views_session_id ON product_views(session_id);
CREATE INDEX idx_product_views_ip_address ON product_views(ip_address);

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_product_metrics_updated_at 
    BEFORE UPDATE ON product_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Analytics tables created successfully!' as message;