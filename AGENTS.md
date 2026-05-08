<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Required Environment Variables

### Firebase (for Phone OTP Auth)
Fill these in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY` — Web API Key from Firebase Console
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` — Usually `rudranex.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` — `rudranex`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` — `rudranex.appspot.com`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` — Sender ID from Firebase Console
- `NEXT_PUBLIC_FIREBASE_APP_ID` — App ID from Firebase Console

### Backend API
- `NEXT_PUBLIC_BASE_URL` — Backend base URL (e.g., `https://rudranex-backend-v2.onrender.com/api/v1`)
