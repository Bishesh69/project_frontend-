# Quiz Application - Full Stack Project

A comprehensive quiz application with separate frontend, backend, and admin panel.

## 📁 Project Structure

```
project/
├── frontend/          # User-facing React application
├── backend/           # Node.js API server
├── admin/             # Admin panel React application
└── README.md          # This file
```

## 🚀 Quick Start

### Frontend (User App)
```bash
cd frontend
npm install
npm start
```
Runs on: http://localhost:3000

### Backend (API Server)
```bash
cd backend
npm install
npm start
```
Runs on: http://localhost:5000

### Admin Panel
```bash
cd admin
npm install
npm start
```
Runs on: http://localhost:3001

## 📋 Features

### Frontend
- User registration and authentication
- Quiz taking interface
- Results and analytics
- Responsive design with Tailwind CSS

### Backend
- RESTful API
- User authentication with JWT
- Quiz management
- MongoDB integration
- Admin routes

### Admin Panel
- User management
- Quiz creation and editing
- Analytics dashboard
- System monitoring

## 🛠 Technologies

- **Frontend**: React, Tailwind CSS, React Router
- **Backend**: Node.js, Express, MongoDB, JWT
- **Admin**: React, Tailwind CSS, React Router
- **Database**: MongoDB Atlas

## 🌐 Deployment

- **Frontend**: Netlify
- **Backend**: Railway
- **Admin**: Vercel (recommended)
- **Database**: MongoDB Atlas

## 📝 Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Admin (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🔐 Admin Access

Default admin credentials:
- Username: `admin`
- Password: `admin123`

## 📄 License

MIT License