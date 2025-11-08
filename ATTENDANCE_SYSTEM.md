# Attendance Tracking System

## Overview
Complete attendance tracking system for monitoring student participation in classes. Supports three status types: Present, Absent, and Excused.

## Database Schema

### Table: `class_attendance`
```sql
- id: UUID (Primary Key)
- class_id: UUID (Foreign Key → classes.id)
- student_id: UUID (Foreign Key → user_profiles.id)
- lesson_date: DATE
- lesson_number: INTEGER
- lesson_title: TEXT (optional)
- status: ENUM ('present', 'absent', 'excused')
- notes: TEXT (optional)
- marked_by: UUID (Foreign Key → user_profiles.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Indexes
- `(class_id, lesson_date)` - Fast queries by class and date
- `student_id` - Fast queries for student attendance history
- `status` - Fast filtering by attendance status

### Unique Constraint
- `(class_id, student_id, lesson_date, lesson_number)` - Prevents duplicate entries

### RLS Policies
- **Students**: Can SELECT their own attendance records only
- **Admins**: Full CRUD access (SELECT, INSERT, UPDATE, DELETE)

## Features

### Admin Features (`/dashboard/admin/classes/[id]/attendance`)
✅ Select lesson date, number, and optional title
✅ View all enrolled students in the class
✅ Mark each student as Present/Absent/Excused with one click
✅ Add optional notes for each student
✅ Real-time statistics (Total, Present, Absent, Excused, Not Marked)
✅ Auto-loads existing attendance records
✅ Upsert functionality prevents duplicate entries
✅ Visual feedback with color-coded buttons
✅ Accessible via "Attendance" button on class management page

### Student Features (`/dashboard/attendance`)
✅ View all attendance records across all enrolled classes
✅ Filter by specific class or view all
✅ Class-specific statistics:
  - Attendance percentage
  - Total lessons
  - Present/Absent/Excused counts
✅ Chronological history with:
  - Class name
  - Lesson date and number
  - Lesson title (if provided)
  - Status badge (color-coded)
  - Notes from instructor (if any)
✅ Visual progress bars for attendance percentage
✅ Accessible via "Attendance" link in dashboard navigation

## Navigation

### Admin Access
1. Dashboard → Admin Panel → Classes
2. Click "Attendance" button on any class
3. Mark attendance for selected lesson

### Student Access
1. Dashboard → Attendance (in sidebar)
2. View statistics and history for all classes
3. Filter by class if needed

## Design
- Samsung Blue theme (#1428A0)
- Glass-card components
- Color-coded status badges:
  - 🟢 Green: Present
  - 🔴 Red: Absent
  - 🟡 Yellow: Excused
- Responsive layout for mobile/tablet/desktop

## Security
- Row Level Security (RLS) enforced on all operations
- Students cannot see other students' attendance
- Students cannot modify attendance records
- Only admins can mark/edit attendance
- Audit trail with `marked_by` and timestamps

## Usage Example

### Admin Marking Attendance
```typescript
// Admin navigates to /dashboard/admin/classes/abc123/attendance
// Selects: Date = 2024-01-15, Lesson Number = 5, Title = "AI Ethics"
// Marks students:
// - Alice: Present
// - Bob: Absent (Note: "Sick leave")
// - Charlie: Excused (Note: "Family emergency")
// Clicks "Save" → Records upserted to database
```

### Student Viewing Attendance
```typescript
// Student navigates to /dashboard/attendance
// Sees:
// - "AI Fundamentals" class: 85% attendance (17/20 lessons)
// - "Web Development" class: 92% attendance (23/25 lessons)
// Filters by "AI Fundamentals"
// Views chronological history with all lesson records
```

## API Endpoints Used
- Supabase `class_attendance` table
- Supabase `classes` table (for class info)
- Supabase `class_enrollments` table (for student list)
- Supabase `user_profiles` table (for student names)

## Future Enhancements (Optional)
- [ ] Export attendance to CSV/Excel
- [ ] Bulk import attendance from spreadsheet
- [ ] Email notifications for absences
- [ ] Attendance trends and analytics
- [ ] Automatic warnings for students with low attendance
- [ ] Calendar view for attendance
- [ ] Attendance reports for parents/guardians

## Migration Applied
✅ Migration: `add_attendance_tracking.sql`
✅ Status: Successfully applied
✅ Date: Current session

## Testing Checklist
- [ ] Admin can mark attendance for a class
- [ ] Students can view their own attendance
- [ ] Students cannot see other students' attendance
- [ ] Duplicate entries are prevented by unique constraint
- [ ] Statistics calculate correctly
- [ ] Filters work properly
- [ ] Notes display correctly
- [ ] Attendance button appears on class management page
- [ ] Attendance link appears in student dashboard
- [ ] Mobile/responsive layout works

## Deployment Notes
- Database migration already applied
- No additional environment variables needed
- Works with existing Supabase setup
- No external API dependencies
