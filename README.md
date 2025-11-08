# 🎓 SÜNİ İNTELLEKT - Learning Management System

A modern, professional Learning Management System built with Next.js 15 and Supabase. This platform provides comprehensive course management, task assignments, attendance tracking, and grading features for educational institutions.

![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.52.0-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-blue)

## 🌟 Features

### 🎯 Core Features
- **Course Management**: Complete CRUD operations for courses, modules, and topics
- **Task System**: Assignment creation, submission, and grading
- **Attendance Tracking**: Mark and monitor student attendance (present/absent/excused)
- **Class Management**: Organize students into classes and assign courses
- **Grading System**: Evaluate assignments with grades and feedback
- **User Roles**: Admin and Student role-based access control
- **Real-time Chat**: Collaborative communication system
- **File Management**: Upload and share course materials (videos, PDFs, notebooks)
- **Email Notifications**: Automated email system with Resend
- **Rich Text Editor**: Tiptap-based content editor with multimedia support
- **YouTube Integration**: Embed and manage video content
- **Jupyter Notebook Support**: View and share interactive notebooks

### 🎨 UI/UX
- **Samsung Design Language**: Professional blue theme (#1428A0)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Glass-card Components**: Modern, clean interface
- **Smooth Animations**: Framer Motion transitions
- **Dark Mode Ready**: Adaptive theming support

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 15.4.2 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4.x
- **Animations**: Framer Motion 12.x
- **Rich Text**: Tiptap 3.x

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **Email Service**: Resend API

### Development Tools
- **Linting**: ESLint 9.x
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Resend account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Email Service (Resend)
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=noreply@yourdomain.com

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Database Setup**
   
   Run the SQL migrations in your Supabase SQL editor in this order:
   ```bash
   1. database/add_notebook_support.sql
   2. database/migrations/add_chat_system.sql
   3. database/migrations/add_indexes_for_chat_and_topics.sql
   4. database/migrations/add_media_links.sql
   5. database/migrations/add_storage_support.sql
   6. database/migrations/add_attendance_tracking.sql
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
lms-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   │   ├── signin/        # Login
│   │   │   ├── signup/        # Registration
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── dashboard/         # Protected dashboard
│   │   │   ├── admin/         # Admin routes
│   │   │   │   ├── courses/   # Course management
│   │   │   │   ├── classes/   # Class management
│   │   │   │   └── tasks/     # Task management
│   │   │   ├── courses/       # Student courses
│   │   │   ├── tasks/         # Student tasks
│   │   │   ├── grades/        # Grade reports
│   │   │   ├── attendance/    # Attendance view
│   │   │   └── chat/          # Chat system
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   │   ├── admin/             # Admin components
│   │   ├── ui/                # UI primitives
│   │   └── *.tsx              # Shared components
│   ├── contexts/              # React contexts
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript types
├── database/                  # SQL migrations
├── email-templates/           # Email HTML templates
└── public/                    # Static assets
```

## 🗂️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `user_profiles` | User information and roles |
| `classes` | Class/group definitions |
| `class_enrollments` | Student-class associations |
| `courses` | Course definitions |
| `modules` | Course sections |
| `topics` | Individual lessons |
| `tasks` | Assignments |
| `submissions` | Student submissions |
| `grades` | Assignment grades |
| `class_attendance` | Attendance records |
| `chat_messages` | Real-time messages |

## 🔐 Authentication

The system uses Supabase Auth with custom email verification:

1. User signs up via `/auth/signup`
2. System sends verification email via Resend
3. User clicks verification link
4. Email is marked as verified
5. User can sign in via `/auth/signin`

### User Roles
- **Admin**: Full system access (course management, grading, attendance)
- **Student**: Limited access (view courses, submit tasks, view grades)

## 🎨 Design System

### Colors
- **Primary**: Samsung Blue (#1428A0)
- **Secondary**: Samsung Cyan (#00B0CA)
- **Accent**: Purple, Pink, Teal gradients
- **Neutral**: Gray scale

### Typography
- **Headings**: Sharp Sans (Samsung font)
- **Body**: Sharp Sans
- **Monospace**: Courier New

### Components
- Glass-card design with backdrop blur
- Rounded corners (xl, 2xl, 3xl)
- Shadow hierarchy (sm, md, lg, xl, 2xl)
- Hover animations and transitions

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Import project to Vercel
   - Connect GitHub repository

2. **Set Environment Variables**
   - Add all `.env.local` variables in Vercel dashboard
   - Set `NEXT_PUBLIC_APP_URL` to your production domain

3. **Deploy**
   - Vercel will automatically build and deploy
   - Set up custom domain if needed

### Environment Variables Checklist
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `NEXT_PUBLIC_APP_URL`

## 📚 Usage

### Admin Workflow

1. **Create Classes**
   - Go to Admin → Classes
   - Create new class with name and description
   - Enroll students

2. **Create Courses**
   - Go to Admin → Courses
   - Add modules and topics
   - Upload materials (videos, PDFs, notebooks)
   - Assign to classes

3. **Create Tasks**
   - Go to course topic
   - Add assignment with description and deadline
   - Set grading criteria

4. **Mark Attendance**
   - Go to Class → Attendance
   - Create lesson or select existing
   - Mark students as present/absent/excused

5. **Grade Assignments**
   - Go to Grading queue
   - Review submissions
   - Assign grades and feedback

### Student Workflow

1. **Enroll in Classes**
   - Admin enrolls students via admin panel

2. **Access Courses**
   - View assigned courses in dashboard
   - Browse modules and topics
   - Watch videos and read materials

3. **Submit Tasks**
   - View task assignments
   - Upload files and write notes
   - Submit before deadline

4. **Check Grades**
   - View grades for submitted tasks
   - Read instructor feedback

5. **View Attendance**
   - Check attendance records
   - See attendance percentage by class

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type check
npx tsc --noEmit
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support:
- Create an issue in the GitHub repository
- Check documentation in code comments
- Review database schema in `/database` folder

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.io/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Tiptap](https://tiptap.dev/) - Rich text editor
- [Resend](https://resend.com/) - Email service
- [Vercel](https://vercel.com/) - Deployment platform

---

Built with ❤️ for modern education
