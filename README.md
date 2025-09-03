# Computer Shop E-commerce Application

This is a final project for an academic semister
A full-stack e-commerce application for selling computers and accessories, featuring user authentication, product management, shopping cart, payment processing, and an AI-powered chatbot for customer support.

## Technologies Used

### Frontend
- React.js
- Ant Design
- SCSS Modules
- Axios for API requests
- JWT authentication

### Backend
- Node.js
- Express.js
- MongoDB
- JWT for authentication
- Bcrypt for password hashing
- Google OAuth integration
- Gemini AI integration for chatbot

### Payment Gateways
- MOMO
- VNPAY
- Cash on Delivery (COD)

## Prerequisites

Before running the application, make sure you have the following installed:
- Node.js (v14.x or later)
- MongoDB (v4.4 or later)
- npm or yarn

### 1. Running the Application

You can run the application using Docker or by starting each service individually.

#### Using Docker (Recommended)

The application is containerized using Docker, which makes it easy to run the entire stack with a single command:

```bash
# Navigate to the project root directory
cd ecommerce_FINAL/compter-shop

# Build Docker images first
docker compose build

# Start all services with Docker Compose
docker compose up -d
```

This will start:
- MongoDB database on port 27018
- Backend server on port 3000
- Frontend client on port 5173
- Database setup container (runs once to initialize data)

To stop the application:

```bash
# Stop all containers
docker compose down
```

To view logs:

```bash
# View logs of all services
docker compose logs

# View logs of a specific service
docker compose logs server
docker compose logs client
```

#### Running Locally (Without Docker)

If you prefer to run the services directly on your machine:

##### Start the Server
```bash
# From the server directory
cd compter-shop/server
npm start
```

##### Start the Client
```bash
# From the client directory
cd compter-shop/client
npm run dev
```

The client will run on http://localhost:5173.

### 2. Environment Variables

#### Server Environment Variables

The `.env` file in the `compter-shop/server` directory contaitns the following variables:

```
# Database
CONNECT_DB=mongodb://localhost:27017/computer-shop

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Google OAuth
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:3000/auth/google/callback
REFRESH_TOKEN=your_google_refresh_token

# Email
USER_EMAIL=your_email@gmail.com

# Gemini AI
API_KEY_GEMINI=your_gemini_api_key

# Client URL for CORS
CLIENT_URL=http://localhost:5173

#### Client Environment Variables

The `.env` file in the `compter-shop/client` directory contaitns the following variables:

```
VITE_API_URL=http://localhost:3000
VITE_CLIENT_ID=your_google_client_id
VITE_SECRET_CRYPTO=your_crypto_secret
```



## Key Features

1. **User Authentication**
   - Local login and registration
   - Google OAuth integration

2. **Product Management**
   - Browse products by category
   - Search functionality
   - Product filtering and sorting
   - Product comparison

3. **Shopping Experience**
   - Shopping cart
   - Multiple payment methods
   - Order tracking

4. **Admin Dashboard**
   - User management
   - Product management
   - Order management
   - Sales statistics

5. **AI Integration**
   - AI-powered chatbot for customer support using Google's Gemini
   - Product comparison using AI

## Demo Accounts

After running the database setup script, you can use the following account:

**Admin User**
The admin will run on http://localhost:5173/admin
- Email: admin@computershop.com
- Password: admin123

## Interview Discussion Points

### Architecture Decision

1. **Why MERN Stack?**
   - MongoDB for flexible document storage suitable for e-commerce product data
   - Express.js for a lightweight backend framework
   - React for a dynamic and responsive UI
   - Node.js for JavaScript across the stack

2. **Authentication System**
   - JWT-based authentication with refresh token mechanism
   - Multiple authentication methods (local, Google)
   - Security measures like HTTP-only cookies

3. **AI Integration**
   - Integration with Google's Gemini API for natural language processing
   - Implementation of a context-aware chatbot that understands product information
   - AI-based product comparison to help users make informed decisions

4. **Payment Gateway Integration**
   - Multiple payment options (MOMO, VNPAY, COD)
   - Secure payment processing
   - Order management workflow

5. **Performance Considerations**
   - Debounced search functionality
   - Optimized MongoDB queries with proper indexing
   - Responsive design for all device sizes

6. **Security Measures**
   - Password hashing with bcrypt
   - HTTP-only cookies for sensitive tokens
   - CSRF protection
   - Input validation

7. **Future Enhancements**
   - Implementing Redis for caching
   - Adding more payment gateways
   - Enhancing the AI capabilities
   - Implementing a recommendation system

## Troubleshooting

If you encounter any issues:

1. Ensure MongoDB is running
2. Check all environment variables are correctly set
3. Verify that all dependencies are installed
4. Check for any console errors
