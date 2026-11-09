# Celebrity's Chat

A mobile-first social app for Android and iOS built with Expo, React Native, TypeScript and Supabase.

## Features in this foundation
- Email/password sign-up and sign-in through Supabase Auth
- Profile creation and session persistence
- Public social feed with verified badges
- Create text posts
- Profile screen and sign out
- Database-backed structure ready for friends, messaging, notifications and verification workflows

## Run locally
1. Install Node.js 20.19.4 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set the Supabase project URL and publishable (or legacy anon) key.
4. Run `npx expo start`.

Never put a Supabase service-role key in the mobile app. Only use the publishable/anon key; database access must be protected by RLS.

## Supabase
Project ref: `sligycfjibouotfnhieo` (EU West / Ireland).

Required tables are provisioned in the linked Supabase project. The app expects `profiles` and `posts` to be readable by signed-in users according to the project's RLS policies.

## Builds
Use Expo Application Services (EAS) to build Android and iOS binaries. Vercel is not required to build native mobile apps.
