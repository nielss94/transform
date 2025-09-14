# 🔐 Google OAuth Setup Guide (Fixed Implementation)

This guide shows you how to properly set up Google OAuth with Supabase using the **web OAuth flow** (not native Android flow).

## 🚨 The Issue We Fixed

**Problem**: You were mixing Android OAuth client (no secret) with Supabase's web OAuth flow (requires secret).

**Solution**: Use a **Web application** OAuth client in Google Cloud Console with both client ID and secret.

## 📋 Step-by-Step Setup

### Step 1: Google Cloud Console - Create Web OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth Client ID**
4. Choose **Web application** (NOT Android!)

#### Configure Web Client:
- **Name**: `Before After Web Client`
- **Authorized JavaScript origins**: (leave empty for now)
- **Authorized redirect URIs**: 
  ```
  https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
  ```
  Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

5. **Save and copy both Client ID and Client Secret**

### Step 2: Supabase Dashboard Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Enter your **Web Client ID** and **Client Secret** from Step 1
5. Save the configuration

### Step 3: Configure Supabase URL Settings

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `beforeafter://auth/callback`
3. Add **Additional Redirect URLs**:
   ```
   beforeafter://auth/callback
   exp://127.0.0.1:19000/--/auth/callback
   exp://localhost:19000/--/auth/callback
   ```

### Step 4: Test the Implementation

#### Development Testing:
```bash
npm start
```

#### Build Testing:
```bash
npm run build:android:dev
```

## 🔧 How It Works Now

### OAuth Flow:
1. User taps "Continue with Google"
2. App creates deep link: `beforeafter://auth/callback`
3. Supabase generates OAuth URL with web client
4. Browser opens Google OAuth (web flow)
5. User authenticates with Google
6. Google redirects to Supabase with auth code
7. Supabase exchanges code for tokens using client secret
8. Supabase redirects to your app: `beforeafter://auth/callback`
9. App handles callback and establishes session

### Key Changes Made:
- ✅ Uses `expo-linking` for proper deep link generation
- ✅ Proper redirect URL: `beforeafter://auth/callback`
- ✅ Added OAuth callback route: `app/auth/callback.tsx`
- ✅ Web OAuth flow (not native Android)
- ✅ Proper session handling with timeout

## 🛠️ Files Modified

### `lib/auth.ts`
- Added `expo-linking` import
- Fixed `signInWithGoogle()` to use `Linking.createURL()`
- Proper redirect URL generation
- Added session establishment timeout

### `app/auth/callback.tsx` (NEW)
- Handles OAuth callback
- Establishes session
- Redirects to appropriate screen

### `package.json`
- Added `expo-linking` dependency

## 🔍 Troubleshooting

### "OAuth secret is missing" Error
- ✅ **Fixed**: Now using web client with secret

### "Redirect URI mismatch" Error
- Ensure `beforeafter://auth/callback` is in Supabase URL config
- Check that Google web client has correct Supabase callback URL

### "Session not established" Error
- Check network connectivity
- Verify Supabase project configuration
- Check console logs for detailed errors

### Development vs Production URLs
- **Development**: `exp://127.0.0.1:19000/--/auth/callback`
- **Production**: `beforeafter://auth/callback`
- Both should be in Supabase Additional Redirect URLs

## 📱 Testing Checklist

- [ ] Google web client created with secret
- [ ] Supabase Google provider configured with web client credentials
- [ ] Supabase URL configuration includes all redirect URLs
- [ ] App scheme is `beforeafter` in `app.json`
- [ ] OAuth callback route exists at `app/auth/callback.tsx`
- [ ] Test in development with `npm start`
- [ ] Test with development build
- [ ] Check console logs for any errors

## 🎯 Expected Behavior

1. **Tap Google button** → Browser opens Google OAuth
2. **Sign in with Google** → Google redirects to Supabase
3. **Supabase processes** → Redirects to `beforeafter://auth/callback`
4. **App handles callback** → User is authenticated and redirected to main app

## 🔐 Security Notes

- Web client secret is handled server-side by Supabase
- Deep links are properly validated
- Session tokens are securely managed by Supabase
- No sensitive credentials stored in mobile app

---

**The key difference**: We now use Google's **web OAuth flow** through Supabase instead of trying to mix native Android OAuth with web OAuth requirements.
