# Süni İntellekt LMS - AI Coding Agent Instructions

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.4.2 with App Router (not Pages Router) - all routes in `src/app/`
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **UI**: React 19, TypeScript 5, Tailwind CSS 4, Framer Motion
- **Rich Text**: Tiptap 3.x for course content editing

### Core Patterns

#### Authentication & Authorization
- **AuthContext** (`src/contexts/AuthContext.tsx`) manages global auth state with profile caching
- All dashboard routes require authentication - use `useAuth()` hook to access user/profile
- Admin-only routes use `<ProtectedRoute requiredRole="admin">` wrapper (see `src/app/dashboard/grading/page.tsx`)
- Never bypass RLS - use `supabaseAdmin` ONLY in API routes (`src/app/api/`)

#### Database Architecture
- **Central schema**: `src/lib/supabase.ts` contains all TypeScript interfaces matching DB tables
- **Migrations**: Run SQL files in `database/migrations/` in order via Supabase SQL editor
- **RLS enforced**: All tables use Row Level Security - profile.role determines access
- **Key tables**: `user_profiles`, `classes`, `class_enrollments`, `courses`, `modules`, `topics`, `tasks`, `submissions`, `grades`, `class_attendance`

#### File Storage Strategy
- **Buckets**: `profile-images` (public), `task-submissions` (private with signed URLs)
- **Upload helper**: Use `uploadFile()` from `src/lib/storage.ts` - never manually call Supabase Storage
- **Signed URLs required** for private buckets: `getSignedFileUrl()` with 1-hour expiry
- Buckets created via migrations, NOT programmatically - check `ensureStorageBuckets()` pattern

## 🚀 Development Workflow

### Getting Started
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # Run ESLint
```

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public anon key
SUPABASE_SERVICE_ROLE_KEY=       # Admin key (API routes only!)
RESEND_API_KEY=                  # Email service
EMAIL_FROM=noreply@domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Performance Optimization Patterns

#### Caching System (`src/lib/cache.ts`)
- **Four specialized caches**: `userCache`, `courseCache`, `taskCache`, `submissionCache`
- Use `getCachedData()` helper for automatic cache-then-fetch pattern
- Invalidate via `CacheInvalidation.*` after mutations
- Example: `CacheInvalidation.invalidateSubmission(id, studentId, taskId)`

#### Request Management (`src/lib/request-manager.ts`)
- **Request deduplication**: Prevents duplicate in-flight requests
- **Circuit breaker**: Auto-blocks failing endpoints after 3 failures for 30s
- **Throttling**: Built-in 1s delay between identical requests
- Use `requestManager.deduplicateRequest()` for expensive operations

## 📋 Common Tasks

### Adding a New Feature to Topics
1. Update `Topic` interface in `src/lib/supabase.ts`
2. Create migration SQL in `database/migrations/add_feature_to_topics.sql`
3. Update `TopicForm.tsx` component if needed
4. Invalidate cache: `CacheInvalidation.invalidateCourse(courseId)`

### Creating New API Route
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  // Get user from session
  const token = request.headers.get('authorization')?.split(' ')[1]
  
  // Use supabaseAdmin for RLS-bypassing admin operations
  const { data, error } = await supabaseAdmin.from('table').select()
  
  return NextResponse.json({ data, error })
}
```

### Adding Admin-Only Page
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      {/* Admin content */}
    </ProtectedRoute>
  )
}
```

## ⚠️ Critical Don'ts

1. **Never hardcode Supabase URLs** - use environment variables only
2. **Don't use supabaseAdmin on client** - API routes only
3. **Never skip RLS checks** - always verify user access in queries
4. **Don't forget cache invalidation** after data mutations
5. **Avoid localStorage for auth tokens** - Supabase handles this
6. **Never upload files without size validation** - see `uploadProfileImage()` pattern
7. **Don't query without error handling** - always check `error` from Supabase responses

## 🎨 UI Conventions

### Design System
- **Primary color**: Samsung Blue `#1428A0`
- **Component pattern**: Glass-card with `backdrop-blur-lg bg-white/90`
- **Animations**: Use Framer Motion `motion.div` with `initial/animate/exit`
- **Icons**: Lucide React (`import { Icon } from 'lucide-react'`)

### Responsive Patterns
```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## 🔧 Troubleshooting

### "String contains non ISO-8859-1 code point"
- Fixed in `src/lib/supabase.ts` via `sanitizeEnvVar()` - check env vars for hidden Unicode

### Profile not loading after sign-in
- Check `AuthContext` profile cache in localStorage (`profile-cache-v1`)
- Verify RLS policies on `user_profiles` table

### File upload fails
- Ensure storage buckets exist via migrations
- Check file size limits: 5MB for images, 50MB for task submissions
- Verify user has proper permissions in bucket policies

## 📚 Key Files Reference

- **Auth logic**: `src/contexts/AuthContext.tsx`
- **DB types**: `src/lib/supabase.ts`
- **Storage**: `src/lib/storage.ts`
- **Caching**: `src/lib/cache.ts`
- **Request mgmt**: `src/lib/request-manager.ts`
- **Layout/providers**: `src/app/layout.tsx`
- **Middleware**: `src/middleware.ts` (MIME type fixes)

## 🎯 Migration Checklist

When adding new database tables:
1. Create SQL migration in `database/migrations/`
2. Add TypeScript interface to `src/lib/supabase.ts`
3. Add RLS policies in migration SQL
4. Create cache key pattern in `CacheKeys` object
5. Add invalidation logic to `CacheInvalidation`
6. Test with both admin and student roles
