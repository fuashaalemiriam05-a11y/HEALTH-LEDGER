# HealthLedger - Backend API

A complete backend system for the HealthLedger multi-page web application, built with Node.js, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Copy `.env.example` to `.env` and update with your database credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=healthledger
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. **Initialize Database**
   ```bash
   npm run init-db
   ```
   
   This will:
   - Create the `healthledger` database
   - Run the schema initialization
   - Create default admin user
   - Set up indexes and triggers

4. **Start the Server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api
   - Health Check: http://localhost:3000/api/health

## 📁 Project Structure

```
healthledger-backend/
├── config/
│   └── database.js          # PostgreSQL connection pool
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── patients.js          # Patient CRUD operations
│   └── records.js           # Medical records CRUD
├── scripts/
│   ├── init-db.js           # Database initialization script
│   └── init-db.sql          # SQL schema definition
├── .env                     # Environment variables (create from .env.example)
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── server.js                # Express server entry point
└── README.md                # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Patients
- `GET /api/patients` - Get all patients (with pagination & search)
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Medical Records
- `GET /api/records` - Get all records (with filtering)
- `GET /api/records/:id` - Get single record
- `GET /api/records/patient/:patientId` - Get all records for a patient
- `POST /api/records` - Create new record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

### Default Admin Credentials
- **Email:** admin@healthledger.org
- **Password:** admin123
- ⚠️ **Change this password immediately after first login!**

## 🗄️ Database Schema

### Tables
1. **facilities** - Clinics/hospitals
2. **users** - Healthcare providers and staff
3. **patients** - Patient information and verification status
4. **medical_records** - Medical records with symptoms, medications, and observations

### Key Features
- Automatic timestamp updates via triggers
- Indexed fields for optimal query performance
- Foreign key relationships for data integrity
- JSONB support for flexible medication storage

## 🧪 Testing the API

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"admin@healthledger.org","password":"admin123"}'
```

### Test Get Patients (with token)
```bash
curl http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Create Patient
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "fullName": "John Doe",
    "patientId": "HS-12345",
    "phone": "+237 6XX XXX XXX",
    "village": "Ekona Village",
    "isVerified": false
  }'
```

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize/reset database

### Environment Variables
See `.env.example` for all available configuration options.

## 📝 Frontend Integration

The frontend HTML files have been updated to connect to the backend API:

1. **welcomelogin.html** - Authenticates users via `/api/auth/login`
2. **homedashboard.html** - Fetches patients from `/api/patients`
3. **newpatientstep1.html** - Creates patients via `/api/patients`

All frontend files store the JWT token in `localStorage` for session management.

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration
- Environment variable protection

## 📊 Database Management

### Reset Database
```bash
npm run init-db
```

### Manual Database Access
```bash
psql -U postgres -d healthledger
```

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify credentials in `.env` file
- Check if database exists: `npm run init-db`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3000

### Module Not Found Errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

## 📄 License

MIT

## 👥 Authors

HealthLedger Team

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request