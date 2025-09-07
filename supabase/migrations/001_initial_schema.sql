-- Create transformations table
CREATE TABLE IF NOT EXISTS transformations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    before_photo_url TEXT NOT NULL,
    after_photo_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'transformation-photos',
    'transformation-photos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for transformation photos
CREATE POLICY "Enable read access for all users" ON storage.objects
FOR SELECT USING (bucket_id = 'transformation-photos');

CREATE POLICY "Enable upload for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'transformation-photos');

CREATE POLICY "Enable update for authenticated users" ON storage.objects
FOR UPDATE USING (bucket_id = 'transformation-photos');

CREATE POLICY "Enable delete for authenticated users" ON storage.objects
FOR DELETE USING (bucket_id = 'transformation-photos');

-- RLS policies for transformations table
ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read transformations (for public feed)
CREATE POLICY "Enable read access for all users" ON transformations
FOR SELECT USING (true);

-- Allow anyone to insert transformations (for anonymous usage initially)
CREATE POLICY "Enable insert for all users" ON transformations
FOR INSERT WITH CHECK (true);

-- Allow anyone to update their own transformations
CREATE POLICY "Enable update for all users" ON transformations
FOR UPDATE USING (true);

-- Allow anyone to delete their own transformations
CREATE POLICY "Enable delete for all users" ON transformations
FOR DELETE USING (true);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_transformations_created_at 
ON transformations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transformations_user_id 
ON transformations (user_id);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transformations_updated_at
    BEFORE UPDATE ON transformations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
