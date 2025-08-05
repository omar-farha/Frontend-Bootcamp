-- Function to increment login count
CREATE OR REPLACE FUNCTION increment_login_count(user_code VARCHAR(8))
RETURNS void AS $$
BEGIN
  UPDATE user_progress 
  SET login_count = login_count + 1,
      last_activity = NOW(),
      updated_at = NOW()
  WHERE user_progress.user_code = increment_login_count.user_code;
  
  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO user_progress (user_code, customer_name, login_count, last_activity)
    SELECT user_code, customer_name, 1, NOW()
    FROM access_codes 
    WHERE code = increment_login_count.user_code;
  END IF;
END;
$$ LANGUAGE plpgsql;
