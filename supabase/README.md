# Supabase Setup for Before-After App

## Quick Setup (Web Dashboard)

1. **Create Storage Bucket:**
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `transformation-photos`
   - Make it public
   - Set file size limit to 5MB
   - Allow image file types: jpeg, png, jpg, webp

2. **Run Migration:**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `migrations/001_initial_schema.sql`
   - Click "Run" to execute

## IaC Setup (Advanced)

If you prefer using Supabase CLI for migrations:

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase:**
   ```bash
   npx supabase init
   ```

3. **Link to your project:**
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Apply migrations:**
   ```bash
   npx supabase db push
   ```

## Environment Variables

Create a `.env.local` file in your project root with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Schema

The app creates a `transformations` table with:
- `id`: UUID primary key
- `before_photo_url`: URL to the before photo
- `after_photo_url`: URL to the after photo (nullable)
- `user_id`: Reference to auth.users (for future user system)
- `created_at`: Timestamp
- `updated_at`: Timestamp (auto-updated)

## Storage Structure

Photos are stored in the `transformation-photos` bucket with the structure:
```
transformation-photos/
├── transformations/
│   ├── before_[timestamp]_[random].jpg
│   └── after_[timestamp]_[random].jpg
```

## Security

- Row Level Security (RLS) is enabled
- Currently allows public read/write (for anonymous usage)
- Ready for user authentication when needed
- File uploads are restricted to images under 5MB
