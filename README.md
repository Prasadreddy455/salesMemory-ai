SECTION 1: INTRO
SalesMemory AI is a modern sales CRM platform that helps sales teams manage customers, track opportunities, and organize activities. It has a powerful backend API and an easy-to-use frontend interface.

SECTION 2: FEATURES
Backend API for data management
Frontend interface for easy use
Customer management and tracking
Sales pipeline visualization
Activity logging for calls, emails, meetings
Real-time data updates
AI-powered insights coming soon

SECTION 3: TECH
Backend: Node.js, Express.js, MongoDB/PostgreSQL, JWT
Frontend: React.js, Tailwind CSS, Axios, Redux
Tools: Git, Docker, Postman

SECTION 4: INSTALLATION
Requirements: Node.js v14+, npm, Git

Clone repo:
git clone https://github.com/Prasadreddy455/salesMemory-ai.git

Backend setup:
cd backend
npm install
npm run dev

Frontend setup:
cd frontend
npm install
npm start

App runs at http://localhost:3000

SECTION 5: API ENDPOINTS
Base URL: http://localhost:5000/api

Auth:
POST /auth/register - Register user
POST /auth/login - Login user
POST /auth/logout - Logout user

Customers:
GET /customers - List all customers
POST /customers - Create customer
GET /customers/:id - Get customer details
PUT /customers/:id - Update customer
DELETE /customers/:id - Delete customer

Sales:
GET /sales - List opportunities
POST /sales - Create opportunity
PUT /sales/:id - Update opportunity
DELETE /sales/:id - Close opportunity

Activities:
GET /activities - List activities
POST /activities - Log activity
