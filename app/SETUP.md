# CropMind Setup Guide

## Database Setup

### 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```sql
CREATE DATABASE cropmind;
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your database URL:

```
DATABASE_URL="postgresql://username:password@localhost:5432/cropmind?schema=public"
JWT_SECRET="your-random-secret-key-here"
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Generate Prisma Client
- Set up the schema

### 5. Generate Prisma Client

```bash
npx prisma generate
```

## Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Run migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   - Navigate to `http://localhost:3000`
   - You'll be redirected to `/auth/login` if not authenticated
   - Register a new account or login

## Features

### Authentication
- **Registration:** Multi-step form with user info + Blynk node setup
- **Login:** Email and password authentication
- **Password Requirements:** Google-standard (8+ chars, uppercase, lowercase, number, special char)
- **Sessions:** JWT-based with database storage

### Data Storage
- **Sensor Data:** Automatically stored in database from Blynk webhooks
- **Historical Data:** Fetched from database (not mock data)
- **Graphs:** Display real-time and historical data from database
- **Download:** Export all user data as CSV or JSON

### User Management
- **Multi-Node Support:** Add multiple Blynk nodes per user
- **Active Node:** Switch between nodes
- **User Profile:** Manage name, language, and nodes

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Sensors
- `GET /api/sensors/history` - Get historical data (from database)
- `GET /api/sensors/download` - Download all user data (CSV/JSON)
- `POST /api/webhooks/blynk` - Blynk webhook (stores in database)

### Nodes
- `GET /api/nodes` - Get user nodes
- `POST /api/nodes` - Save nodes

## Production Deployment

1. **Set up PostgreSQL database** (e.g., Supabase, Railway, Neon)

2. **Set environment variables** in your deployment platform:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `OPENWEATHER_API_KEY`
   - `ACCUWEATHER_API_KEY`

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify database exists
- Check firewall/network settings

### Migration Issues
- Run `npx prisma migrate reset` to reset database (WARNING: deletes all data)
- Check Prisma schema for errors
- Ensure database user has proper permissions

### Authentication Issues
- Check `JWT_SECRET` is set
- Verify token is being sent in Authorization header
- Check session expiration



