-- Script to add calorie information to existing food items
-- Run this after executing the main calorie-tracker-schema.sql

-- Add calorie columns if they don't exist
ALTER TABLE food ADD COLUMN IF NOT EXISTS total_calories INTEGER DEFAULT 0;
ALTER TABLE food ADD COLUMN IF NOT EXISTS protein_content NUMERIC DEFAULT 0;
ALTER TABLE food ADD COLUMN IF NOT EXISTS carbs_content NUMERIC DEFAULT 0;
ALTER TABLE food ADD COLUMN IF NOT EXISTS fat_content NUMERIC DEFAULT 0;

-- Add calorie information to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS total_calories INTEGER DEFAULT 0;

-- Update existing food items with estimated calorie data based on food names
UPDATE food SET total_calories = 
    CASE 
        -- Pizza items
        WHEN LOWER(name) LIKE '%pizza%' AND LOWER(name) LIKE '%large%' THEN 350
        WHEN LOWER(name) LIKE '%pizza%' AND LOWER(name) LIKE '%medium%' THEN 280
        WHEN LOWER(name) LIKE '%pizza%' AND LOWER(name) LIKE '%small%' THEN 220
        WHEN LOWER(name) LIKE '%pizza%' THEN 280
        
        -- Burger items
        WHEN LOWER(name) LIKE '%burger%' AND LOWER(name) LIKE '%double%' THEN 450
        WHEN LOWER(name) LIKE '%burger%' AND LOWER(name) LIKE '%cheese%' THEN 320
        WHEN LOWER(name) LIKE '%burger%' THEN 300
        
        -- Chicken items
        WHEN LOWER(name) LIKE '%chicken%' AND LOWER(name) LIKE '%fried%' THEN 250
        WHEN LOWER(name) LIKE '%chicken%' AND LOWER(name) LIKE '%grilled%' THEN 180
        WHEN LOWER(name) LIKE '%chicken%' THEN 200
        
        -- Salad items
        WHEN LOWER(name) LIKE '%salad%' AND LOWER(name) LIKE '%caesar%' THEN 180
        WHEN LOWER(name) LIKE '%salad%' AND LOWER(name) LIKE '%greek%' THEN 160
        WHEN LOWER(name) LIKE '%salad%' THEN 120
        
        -- Sandwich items
        WHEN LOWER(name) LIKE '%sandwich%' AND LOWER(name) LIKE '%club%' THEN 280
        WHEN LOWER(name) LIKE '%sandwich%' THEN 220
        
        -- Pasta items
        WHEN LOWER(name) LIKE '%pasta%' AND LOWER(name) LIKE '%cream%' THEN 320
        WHEN LOWER(name) LIKE '%pasta%' AND LOWER(name) LIKE '%alfredo%' THEN 350
        WHEN LOWER(name) LIKE '%pasta%' THEN 250
        
        -- Rice dishes
        WHEN LOWER(name) LIKE '%rice%' AND LOWER(name) LIKE '%fried%' THEN 220
        WHEN LOWER(name) LIKE '%rice%' THEN 180
        
        -- Fish items
        WHEN LOWER(name) LIKE '%fish%' AND LOWER(name) LIKE '%fried%' THEN 220
        WHEN LOWER(name) LIKE '%fish%' AND LOWER(name) LIKE '%grilled%' THEN 160
        WHEN LOWER(name) LIKE '%salmon%' THEN 180
        WHEN LOWER(name) LIKE '%tuna%' THEN 150
        WHEN LOWER(name) LIKE '%fish%' THEN 170
        
        -- Soup items
        WHEN LOWER(name) LIKE '%soup%' AND LOWER(name) LIKE '%cream%' THEN 180
        WHEN LOWER(name) LIKE '%soup%' THEN 120
        
        -- Beverages
        WHEN LOWER(name) LIKE '%soda%' OR LOWER(name) LIKE '%cola%' THEN 140
        WHEN LOWER(name) LIKE '%juice%' AND LOWER(name) LIKE '%orange%' THEN 110
        WHEN LOWER(name) LIKE '%juice%' THEN 100
        WHEN LOWER(name) LIKE '%smoothie%' THEN 180
        WHEN LOWER(name) LIKE '%milkshake%' THEN 300
        WHEN LOWER(name) LIKE '%coffee%' AND LOWER(name) LIKE '%latte%' THEN 120
        WHEN LOWER(name) LIKE '%coffee%' THEN 5
        WHEN LOWER(name) LIKE '%tea%' THEN 2
        WHEN LOWER(name) LIKE '%water%' THEN 0
        
        -- Desserts
        WHEN LOWER(name) LIKE '%cake%' THEN 350
        WHEN LOWER(name) LIKE '%ice cream%' OR LOWER(name) LIKE '%icecream%' THEN 200
        WHEN LOWER(name) LIKE '%cookie%' THEN 80
        WHEN LOWER(name) LIKE '%brownie%' THEN 240
        WHEN LOWER(name) LIKE '%pie%' THEN 280
        
        -- Appetizers
        WHEN LOWER(name) LIKE '%fries%' AND LOWER(name) LIKE '%large%' THEN 320
        WHEN LOWER(name) LIKE '%fries%' THEN 220
        WHEN LOWER(name) LIKE '%wings%' THEN 180
        WHEN LOWER(name) LIKE '%nachos%' THEN 280
        WHEN LOWER(name) LIKE '%onion rings%' THEN 240
        
        -- Breakfast items
        WHEN LOWER(name) LIKE '%pancake%' THEN 200
        WHEN LOWER(name) LIKE '%waffle%' THEN 220
        WHEN LOWER(name) LIKE '%omelet%' OR LOWER(name) LIKE '%omelette%' THEN 180
        WHEN LOWER(name) LIKE '%toast%' THEN 80
        WHEN LOWER(name) LIKE '%bagel%' THEN 150
        
        -- Default for unmatched items
        ELSE 200
    END
WHERE total_calories = 0 OR total_calories IS NULL;

-- Update protein content estimates
UPDATE food SET protein_content = 
    CASE 
        WHEN LOWER(name) LIKE '%chicken%' OR LOWER(name) LIKE '%fish%' OR LOWER(name) LIKE '%salmon%' OR LOWER(name) LIKE '%tuna%' THEN 25
        WHEN LOWER(name) LIKE '%burger%' THEN 20
        WHEN LOWER(name) LIKE '%pizza%' THEN 12
        WHEN LOWER(name) LIKE '%salad%' THEN 8
        WHEN LOWER(name) LIKE '%pasta%' THEN 10
        WHEN LOWER(name) LIKE '%rice%' THEN 4
        WHEN LOWER(name) LIKE '%soup%' THEN 6
        ELSE 8
    END
WHERE protein_content = 0 OR protein_content IS NULL;

-- Sample deal calorie calculations (you can customize these)
UPDATE deals SET total_calories = 
    CASE 
        WHEN LOWER(deal_name) LIKE '%combo%' THEN 450
        WHEN LOWER(deal_name) LIKE '%family%' THEN 800
        WHEN LOWER(deal_name) LIKE '%lunch%' THEN 350
        WHEN LOWER(deal_name) LIKE '%dinner%' THEN 500
        ELSE 400
    END
WHERE total_calories = 0 OR total_calories IS NULL;

-- Display updated counts
SELECT 
    'Food items updated' as table_name,
    COUNT(*) as updated_count,
    AVG(total_calories) as avg_calories
FROM food 
WHERE total_calories > 0

UNION ALL

SELECT 
    'Deals updated' as table_name,
    COUNT(*) as updated_count,
    AVG(total_calories) as avg_calories
FROM deals 
WHERE total_calories > 0;

-- Show sample of updated food items
SELECT 
    name,
    total_calories,
    protein_content,
    price
FROM food 
WHERE total_calories > 0 
ORDER BY total_calories DESC 
LIMIT 10;