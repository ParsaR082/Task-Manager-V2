# Task Manager App - MongoDB Version

A clean Next.js 14 task management application with Google OAuth authentication and MongoDB.

## Features

🔐 **Authentication**
- Google OAuth integration with NextAuth.js
- Protected routes and session management
- Clean, minimal login interface

🗃️ **Database**
- MongoDB with Prisma ORM
- ObjectId-based schema design
- Optimized for document storage

🧩 **Tasks & Projects**
- Create, update, delete, and organize tasks
- Project-based task organization
- Drag and drop task reordering
- Task status tracking (todo, in-progress, done)
- Tags and deadline management

📊 **Analytics & Visualizations**
- Task completion charts over time
- Status distribution analytics
- Upcoming deadline tracking

🔍 **Filtering & Search**
- Filter by status, project, deadline, and tags
- Advanced search functionality

🔔 **Notifications**
- Real-time toast notifications
- Deadline reminders

🎨 **Modern UI**
- Beautiful animations with Framer Motion
- Responsive design with Tailwind CSS
- shadcn/ui components

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo>
cd task-manager
npm install
```

### 2. Set up MongoDB

Create a MongoDB Atlas account and cluster, then get your connection string.

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-at-least-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority"
```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI

### 5. Set up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to MongoDB
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to MongoDB
npm run db:push

# Open Prisma Studio (database browser)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── dashboard/         # Protected dashboard page
│   ├── api/               # API routes
│   └── page.tsx           # Login page (root route)
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── providers/        # Context providers
├── lib/                  # Utilities and configurations
├── prisma/               # Database schema and seed
├── types/                # TypeScript definitions
└── middleware.ts         # Route protection
```

## MongoDB Schema

The application uses MongoDB with the following models:
- **User**: User accounts and profiles
- **Account**: OAuth account linking
- **Session**: User sessions
- **Project**: Task organization containers
- **Task**: Individual tasks with status, priority, etc.
- **Tag**: Labels for categorizing tasks
- **TaskTag**: Many-to-many relationship between tasks and tags

All models use MongoDB ObjectIds for primary keys and relationships.

## Development

- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Production**: `npm run start` 