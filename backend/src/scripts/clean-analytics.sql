-- Clean up all mock analytics data to start fresh
-- This will reset analytics to show real zeros until actual usage generates data

-- Clear all analytics tables
TRUNCATE TABLE product_views CASCADE;
TRUNCATE TABLE online_sessions CASCADE;
TRUNCATE TABLE sales_analytics CASCADE;
TRUNCATE TABLE product_metrics CASCADE;