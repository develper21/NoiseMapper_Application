# NoiseMapper Backend API

A Node.js/Express backend API for the NoiseMapper application using PostgreSQL and Drizzle ORM.

## Features

- **Authentication**: JWT-based authentication with secure session management
- **Reports**: Create and fetch noise pollution reports with location-based filtering
- **Security**: Rate limiting, CORS, helmet security headers
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your database connection in `.env.local`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/noisemapper
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
```

5. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/signout` - Logout user (protected)

### Reports

- `GET /api/reports` - Get all reports with optional filtering
- `POST /api/reports` - Create a new report (protected)

### User

- `GET /api/user/profile` - Get user profile (protected)

### Health

- `GET /health` - Health check endpoint

## Database Schema

### Users Table
- `id` - UUID primary key
- `email` - Unique email address
- `name` - Optional display name
- `avatar_url` - Optional profile picture URL
- `password_hash` - Bcrypt hashed password
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Reports Table
- `id` - UUID primary key
- `user_id` - Foreign key to users (nullable for anonymous reports)
- `latitude` - Geographic latitude
- `longitude` - Geographic longitude
- `noise_db` - Noise level in decibels
- `noise_type` - Type of noise (traffic, construction, events, industrial, other)
- `description` - Optional description
- `media_urls` - Array of media URLs
- `is_anonymous` - Boolean flag for anonymous reports
- `created_at` - Timestamp
- `updated_at` - Timestamp

### User Sessions Table
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `token_hash` - Hashed JWT token
- `expires_at` - Token expiration time
- `created_at` - Timestamp

## Security Features

- JWT authentication with secure token storage
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Input validation with Joi

## Development Tools

- `npm run db:studio` - Open Drizzle Studio for database management
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database

## Environment Variables

See `.env.example` for all available environment variables.
