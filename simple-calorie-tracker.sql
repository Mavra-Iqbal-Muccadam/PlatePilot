-- SIMPLE CALORIE TRACKER - Just user ID, daily calories, and limit
-- Drop existing complex tables and create simple one

DROP TABLE IF EXISTS calorie_log CASCADE;
DROP TABLE IF EXISTS user_calorie_tracker CASCADE;

-- Simple calorie tracker table - just the essentials
CREATE TABLE user_calorie_tracker (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_calories INTEGER NOT NULL DEFAULT 0,
    daily_limit INTEGER NOT NULL DEFAULT 2000,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Auto-reset daily calories at midnight
    UNIQUE(user_id, date)
);

-- Simple function to get user's current calories
CREATE OR REPLACE FUNCTION get_user_calories(p_user_id INTEGER)
RETURNS JSON AS $
DECLARE
    user_calories INTEGER := 0;
    user_limit INTEGER := 2000;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get today's calories for user
    SELECT daily_calories, daily_limit INTO user_calories, user_limit
    FROM user_calorie_tracker
    WHERE user_id = p_user_id::BIGINT AND date = today_date;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_calorie_tracker (user_id, daily_calories, daily_limit, date)
        VALUES (p_user_id::BIGINT, 0, 2000, today_date);
        user_calories := 0;
        user_limit := 2000;
    END IF;
    
    RETURN json_build_object(
        'current_calories', user_calories,
        'daily_limit', user_limit,
        'limit_exceeded', user_calories > user_limit,
        'remaining_calories', GREATEST(0, user_limit - user_calories)
    );
END;
$ LANGUAGE plpgsql;

-- Simple function to add calories
CREATE OR REPLACE FUNCTION add_calories(p_user_id INTEGER, p_calories INTEGER)
RETURNS JSON AS $
DECLARE
    new_total INTEGER;
    user_limit INTEGER;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Insert or update calories for today
    INSERT INTO user_calorie_tracker (user_id, daily_calories, daily_limit, date, updated_at)
    VALUES (p_user_id::BIGINT, p_calories, 2000, today_date, NOW())
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        daily_calories = user_calorie_tracker.daily_calories + p_calories,
        updated_at = NOW()
    RETURNING daily_calories, daily_limit INTO new_total, user_limit;
    
    RETURN json_build_object(
        'success', TRUE,
        'current_calories', new_total,
        'daily_limit', user_limit,
        'limit_exceeded', new_total > user_limit,
        'remaining_calories', GREATEST(0, user_limit - new_total),
        'calories_added', p_calories
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
        'error', SQLERRM
    );
END;
$ LANGUAGE plpgsql;

-- Simple function to set daily limit
CREATE OR REPLACE FUNCTION set_daily_limit(p_user_id INTEGER, p_limit INTEGER)
RETURNS JSON AS $
DECLARE
    current_calories INTEGER;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Insert or update limit for today
    INSERT INTO user_calorie_tracker (user_id, daily_calories, daily_limit, date, updated_at)
    VALUES (p_user_id::BIGINT, 0, p_limit, today_date, NOW())
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        daily_limit = p_limit,
        updated_at = NOW()
    RETURNING daily_calories INTO current_calories;
    
    RETURN json_build_object(
        'success', TRUE,
        'current_calories', current_calories,
        'daily_limit', p_limit,
        'limit_exceeded', current_calories > p_limit
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
        'error', SQLERRM
    );
END;
$ LANGUAGE plpgsql;

-- Simple function to reset calories to 0
CREATE OR REPLACE FUNCTION reset_calories(p_user_id INTEGER)
RETURNS JSON AS $
DECLARE
    user_limit INTEGER;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Reset calories to 0 for today
    UPDATE user_calorie_tracker
    SET daily_calories = 0, updated_at = NOW()
    WHERE user_id = p_user_id::BIGINT AND date = today_date
    RETURNING daily_limit INTO user_limit;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_calorie_tracker (user_id, daily_calories, daily_limit, date)
        VALUES (p_user_id::BIGINT, 0, 2000, today_date);
        user_limit := 2000;
    END IF;
    
    RETURN json_build_object(
        'success', TRUE,
        'current_calories', 0,
        'daily_limit', user_limit
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
        'error', SQLERRM
    );
END;
$ LANGUAGE plpgsql;