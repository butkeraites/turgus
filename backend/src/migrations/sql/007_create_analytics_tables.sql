-- Analytics tables for tracking user behavior and metrics

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS product_views CASCADE;
DROP TABLE IF EXISTS online_sessions CASCADE;
DROP TABLE IF EXISTS sales_analytics CASCADE;
DROP TABLE IF EXISTS product_metrics CASCADE;

-- Product views tracking
CREATE TABLE product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES buyer_accounts(id) ON DELETE SET NULL, -- NULL for anonymous views
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255) -- For tracking anonymous sessions
);

-- Create indexes for product_views
CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_viewed_at ON product_views(viewed_at);
CREATE INDEX idx_product_views_session ON product_views(session_id);

-- Online users tracking (for real-time metrics)
CREATE TABLE online_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES buyer_accounts(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for online_sessions
CREATE INDEX idx_online_sessions_user_id ON online_sessions(user_id);
CREATE INDEX idx_online_sessions_last_activity ON online_sessions(last_activity);
CREATE INDEX idx_online_sessions_active ON online_sessions(is_active);

-- Sales analytics (completed orders)
CREATE TABLE sales_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES seller_accounts(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyer_accounts(id) ON DELETE CASCADE,
    want_list_id UUID NOT NULL REFERENCES want_lists(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    item_count INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sales_analytics
CREATE INDEX idx_sales_analytics_seller_id ON sales_analytics(seller_id);
CREATE INDEX idx_sales_analytics_buyer_id ON sales_analytics(buyer_id);
CREATE INDEX idx_sales_analytics_completed_at ON sales_analytics(completed_at);

-- Product performance metrics
CREATE TABLE product_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    want_list_adds INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id)
);

-- Create indexes for product_metrics
CREATE INDEX idx_product_metrics_product_id ON product_metrics(product_id);