-- Update RLS policies for transformations table to properly secure user data

-- First, delete any existing transformations with null user_id (anonymous data from before auth)
-- This ensures we start clean with the new authentication system
DELETE FROM transformations WHERE user_id IS NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON transformations;
DROP POLICY IF EXISTS "Enable insert for all users" ON transformations;
DROP POLICY IF EXISTS "Enable update for all users" ON transformations;
DROP POLICY IF EXISTS "Enable delete for all users" ON transformations;

-- Create new secure policies

-- Allow all users to read all transformations (for public feed)
CREATE POLICY "Allow public read access" ON transformations
FOR SELECT USING (true);

-- Allow authenticated users to insert their own transformations
CREATE POLICY "Allow authenticated users to create transformations" ON transformations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Allow users to update only their own transformations
CREATE POLICY "Allow users to update own transformations" ON transformations
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own transformations
CREATE POLICY "Allow users to delete own transformations" ON transformations
FOR DELETE USING (auth.uid() = user_id);

-- Now ensure user_id cannot be null for new records
ALTER TABLE transformations ALTER COLUMN user_id SET NOT NULL;
