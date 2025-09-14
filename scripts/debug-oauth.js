#!/usr/bin/env node

/**
 * OAuth Debug Helper
 * Run with: node scripts/debug-oauth.js
 */

console.log('🔍 OAuth Debug Checklist\n');

console.log('📋 Things to check in your logs when testing:');
console.log('');
console.log('1. 🔍 DEBUG: OAuth redirect URL: beforeafter://auth/callback');
console.log('2. 🔍 DEBUG: Supabase OAuth response: { data: { url: "..." }, error: null }');
console.log('3. 🔍 DEBUG: Opening OAuth URL: https://...');
console.log('4. 🔍 DEBUG: WebBrowser result: { type: "success" | "cancel" | "dismiss" }');
console.log('5. 🔍 DEBUG: Auth callback route triggered');
console.log('6. 🔍 DEBUG: Session check: { hasSession: true/false }');
console.log('');

console.log('❌ Common failure points:');
console.log('');
console.log('• WebBrowser result.type = "cancel" → User cancelled');
console.log('• WebBrowser result.type = "dismiss" → Browser dismissed');
console.log('• No session after OAuth → Redirect URL mismatch');
console.log('• Supabase error → Google client misconfiguration');
console.log('');

console.log('🔧 Quick fixes to try:');
console.log('');
console.log('1. Check Supabase Dashboard → Authentication → URL Configuration:');
console.log('   Site URL: beforeafter://auth/callback');
console.log('   Additional URLs: beforeafter://auth/callback, exp://127.0.0.1:19000/--/auth/callback');
console.log('');
console.log('2. Check Google Cloud Console → OAuth Client:');
console.log('   Type: Web application (NOT Android)');
console.log('   Redirect URI: https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback');
console.log('');
console.log('3. Check Supabase Google Provider:');
console.log('   Client ID and Secret from Web OAuth client');
console.log('');

console.log('📱 To test:');
console.log('1. npm start');
console.log('2. Open app → Try Google login');
console.log('3. Watch console logs for the debug messages above');
console.log('4. Share the logs to identify where it fails');
