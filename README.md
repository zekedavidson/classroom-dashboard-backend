# Classroom Management System - Backend

A robust, type-safe Express backend for the Classroom Management System, providing full CRUD APIs, authentication, role-based access control, and database interactions.

## 🚀 Tech Stack

- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: TypeScript
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: [Neon Postgres](https://neon.tech/)
- **Authentication**: [better-auth](https://better-auth.com/)
- **Security**: [Arcjet](https://arcjet.com/) (Rate limiting & Bot protection)

## ✨ Features

- **Authentication & Authorization**: Secure email/password login and role-based access control (Admin, Teacher, Student).
- **CRUD Operations**: Dedicated REST endpoints for Users, Departments, Subjects, and Classes.
- **Enrollment Management**: APIs to handle student class enrollments securely.
- **Database Seeding**: Easily populate the database with demo data for testing.
- **Security Middleware**: Arcjet-powered rate limiting to defend against bots and abuse.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Neon Postgres database URL
- Arcjet API Key
- Better Auth Secret

### Environment Variables

Create a `.env` file in the root of the backend directory and add the following:

```env
# Server
PORT=8000
FRONTEND_URL=http://localhost:5173

# Database (Neon Postgres)
DATABASE_URL="postgres://user:password@hostname/dbname?sslmode=require"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your_random_secret_string"
BETTER_AUTH_URL="http://localhost:8000"

# Security (Arcjet)
ARCJET_KEY="your_arcjet_api_key_here"
ARCJET_ENV="development" # or "production"
```

### Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd classroom-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate and push the database schema:
   ```bash
   npm run db:push
   ```

4. Seed the database with demo data (recommended):
   ```bash
   npm run db:seed
   ```

### Running the Server

Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:8000`.

## 📂 Project Structure

- `src/db/`: Database configuration, Drizzle schemas, and seeding scripts.
- `src/lib/`: Core utilities like the `better-auth` configuration instance.
- `src/middleware/`: Security logic (Arcjet) and authentication/role-guard middlewares.
- `src/routes/`: Express routers organized by domain (Users, Classes, Subjects, Departments).
- `src/index.ts`: The main application entry point.

## 🤝 API Documentation (Brief)

- `GET /api/auth/*` - Better Auth managed authentication endpoints.
- `GET/POST/PUT/DELETE /api/users` - User management.
- `GET/POST/PUT/DELETE /api/classes` - Class management.
  - `POST /api/classes/:id/enroll` - Enroll a student.
  - `DELETE /api/classes/:id/enroll/:studentId` - Unenroll a student.
- `GET/POST/PUT/DELETE /api/subjects` - Subject management.
- `GET/POST/PUT/DELETE /api/departments` - Department management.

*Note: All mutating endpoints (`POST`, `PUT`, `DELETE`) are protected by Role-Based Access Control and require an `admin` or `teacher` session.*
