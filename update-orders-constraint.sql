-- Update the orders table constraint to allow 'mixed' order type

-- Drop the existing check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;

-- Add new check constraint that includes 'mixed'
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check 
CHECK (order_type IN ('food', 'deal', 'mixed'));

-- Verify the constraint was updated
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass 
AND conname = 'orders_order_type_check';