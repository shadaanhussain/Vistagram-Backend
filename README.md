# Vistagram Backend

A full-featured Node.js + Express + MongoDB + Cloudinary backend for a social media application with JWT authentication, automated content generation, and comprehensive testing.

## Features

- **User Authentication**: JWT-based auth with access/refresh tokens
- **Image Upload**: Cloudinary integration for image storage and optimization
- **Social Features**: Posts, likes, shares with real-time interactions
- **Automated Content**: AI-powered user and post generation using Grok API
- **Scheduled Tasks**: Cron jobs for database population
- **Comprehensive Testing**: Jest test suite with 100% coverage
- **Security**: Password hashing, CORS, input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **Password Security**: bcrypt
- **Task Scheduling**: node-cron
- **Testing**: Jest + Supertest + MongoDB Memory Server
- **AI Integration**: Grok API via OpenRouter

## Project Structure

```
src/
├── config/          # Database and Cloudinary configuration
├── controllers/     # Route handlers (auth, posts, users, likes, shares)
├── middlewares/     # Authentication and error handling
├── models/          # MongoDB schemas (User, Post, Like)
├── routes/          # API route definitions
├── services/        # Business logic (cron service)
└── app.js          # Express app setup

tests/              # Comprehensive test suite
scripts/            # Database population scripts
coverage/           # Test coverage reports
```

## Setup

### Prerequisites
- Node.js (v14+)
- MongoDB
- Cloudinary account
- OpenRouter API key (for AI features)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd vistagram-backend
npm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env
```

3. **Update `.env` with your credentials**:
```env
MONGO_URI=mongodb://localhost:27017/vistagram
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
PORT=5000
FRONTEND_URL=http://localhost:3000
OPENROUTER_API_KEY=your_openrouter_key
DEFAULT_PASSWORD=password123
MIN_USERS=5
MIN_POSTS=10
CRON_ENABLED=true
CRON_SCHEDULE=0 12 * * *
```

4. **Start the server**:
```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout (requires auth)

### Users
- `POST /api/users` - Create user profile
- `GET /api/users/:id` - Get user profile

### Posts
- `POST /api/posts` - Create post with image upload (requires auth)
- `GET /api/posts` - Get all posts (optional auth for like status)
- `GET /api/posts/:id` - Get specific post (optional auth)

### Likes
- `POST /api/posts/:id/like` - Toggle like/unlike (requires auth)
- `GET /api/posts/:id/likes` - Get post likes

### Shares
- `POST /api/posts/:id/share` - Share post

### Cron Jobs
- `POST /api/populate` - Manually trigger database population

## Request Examples

### Create Post
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer <access_token>" \
  -F "image=@photo.jpg" \
  -F "caption=Beautiful sunset!"
```

### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","email":"john@example.com","password":"password123"}'
```

## Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run server     # Alias for dev
npm run populate   # Populate database with sample data
npm run cron:test  # Test cron job manually
npm test           # Run test suite
npm run test:watch # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:ci    # Run tests for CI/CD
```

### Testing

Comprehensive test suite with Jest:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

Test coverage includes:
- Controllers (auth, posts, users, likes, shares)
- Middlewares (authentication, error handling)
- Models (User, Post validation)
- Routes (API endpoints)
- Services (cron functionality)

### Database Population

Automated content generation using AI:

```bash
# Manual population
npm run populate

# Scheduled via cron (configurable in .env)
# Default: Daily at 12 PM UTC
```

Features:
- AI-generated usernames via Grok API
- Random images from Picsum
- AI-generated captions for images
- Automatic Cloudinary upload
- Configurable minimum users/posts

## Authentication Flow

1. **Register/Login**: Receive access token (15m) + refresh token (7d)
2. **API Requests**: Include `Authorization: Bearer <access_token>`
3. **Token Refresh**: Use refresh token to get new access token
4. **Logout**: Invalidate refresh token

## Error Handling

Standardized error responses:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration
- Input validation and sanitization
- Secure cookie handling
- Environment variable protection

## Deployment

### Environment Variables
Ensure all required environment variables are set in production.

### Database
MongoDB Atlas recommended for production deployment.

### File Storage
Cloudinary handles image optimization and CDN delivery.

### Process Management
Use PM2 or similar for production process management:

```bash
npm install -g pm2
pm2 start src/app.js --name vistagram-backend
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request

## License

MIT License