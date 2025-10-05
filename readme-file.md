# 🎨 Collaborative Whiteboard

A real-time collaborative whiteboard application built with React, Node.js, Socket.io, and MongoDB. Draw together, chat in real-time, and collaborate seamlessly with multiple users.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)

## ✨ Features

### 🖌️ Drawing Tools
- **Pen Tool** - Free-hand drawing with adjustable stroke width
- **Line Tool** - Draw straight lines
- **Rectangle Tool** - Create rectangles
- **Circle Tool** - Draw circles
- **Eraser** - True pixel erasing (removes drawings, not just covers)
- **Color Picker** - Full color palette with 12 preset colors
- **Stroke Width Control** - Adjust pen/line thickness (1-20px)
- **Clear Canvas** - Remove all drawings with confirmation
- **Undo** - Remove your last drawing

### 💬 Real-Time Chat
- Send messages instantly to all collaborators
- Edit your own messages (shows "edited" tag)
- Delete your own messages
- Pin important messages (anyone can pin)
- Messages auto-delete after 24 hours
- 500 character limit per message
- Smart timestamp formatting (Just now, 5m ago, 2h ago, etc.)

### 👥 Multi-User Collaboration
- See other users' cursors in real-time with their names
- Live user list showing active collaborators
- Connection status indicator
- User colors for easy identification

### 🔐 Authentication & Rooms
- Secure JWT-based authentication
- Create boards with unique room codes
- Join existing boards using room codes
- Private board option
- Board ownership and access control

### 💾 Data Persistence
- All drawings saved to MongoDB
- Drawings persist across sessions
- Messages stored with 24-hour auto-deletion
- Real-time synchronization across all users

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communication
- **React Router** - Navigation
- **Axios** - HTTP requests

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - WebSocket library
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Ajithkumart1/collaborative-whiteboard.git
cd collaborative-whiteboard
```

### 2️⃣ Install Server Dependencies

```bash
cd server
npm install
```

**Server Dependencies:**
- express
- socket.io
- mongoose
- jsonwebtoken
- bcryptjs
- dotenv
- cors

### 3️⃣ Install Client Dependencies

```bash
cd ../client
npm install
```

**Client Dependencies:**
- react
- react-dom
- react-router-dom
- socket.io-client
- axios
- tailwindcss

### 4️⃣ Set Up Environment Variables

#### Server Environment (server/.env)

Create a `.env` file in the `server` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/whiteboard
JWT_SECRET=your_super_secret_jwt_key_here_change_this
FRONTEND_URL=http://localhost:5173
```

**How to generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Client Environment (client/.env)

Create a `.env` file in the `client` folder:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 5️⃣ Start MongoDB

**Option 1: MongoDB Community Edition (Local)**
```bash
# macOS
brew services start mongodb-community

# Windows (Run as Administrator)
net start MongoDB

# Linux
sudo systemctl start mongod
```

**Option 2: MongoDB Atlas (Cloud)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in server/.env

### 6️⃣ Run the Application

Open **two terminal windows**:

**Terminal 1 - Start Backend Server:**
```bash
cd server
npm start

# Or with nodemon for auto-restart:
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📡 Socket.io ready for connections
✅ MongoDB Connected
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 7️⃣ Open the Application

Open your browser and go to: **http://localhost:5173**

## 📁 Project Structure

```
collaborative-whiteboard/
│
├── client/                          # React Frontend
│   ├── public/                      # Static files
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── Canvas.jsx           # Drawing canvas
│   │   │   ├── Chat.jsx             # Chat component
│   │   │   ├── Toolbar.jsx          # Drawing tools
│   │   │   ├── UserList.jsx         # Active users list
│   │   │   └── Navbar.jsx           # Navigation bar
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration page
│   │   │   ├── Home.jsx             # Dashboard/boards list
│   │   │   └── Board.jsx            # Main whiteboard page
│   │   │
│   │   ├── context/                 # React Context
│   │   │   └── AuthContext.jsx      # Authentication state
│   │   │
│   │   ├── hooks/                   # Custom hooks
│   │   │   └── useSocket.js         # Socket.io hook
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   └── api.js               # Axios instance
│   │   │
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                 # Entry point
│   │
│   ├── .env.example                 # Environment template
│   ├── .gitignore
│   ├── package.json
│   ├── vite.config.js               # Vite configuration
│   └── tailwind.config.js           # Tailwind CSS config
│
├── server/                          # Node.js Backend
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   │
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication middleware
│   │
│   ├── models/                      # Mongoose models
│   │   ├── Board.js                 # Board schema
│   │   └── User.js                  # User schema
│   │
│   ├── routes/                      # Express routes
│   │   ├── auth.js                  # Auth endpoints
│   │   └── boards.js                # Board endpoints
│   │
│   ├── socket/
│   │   └── socketHandler.js         # Socket.io events
│   │
│   ├── .env.example                 # Environment template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                    # Main server file
│
├── .gitignore                       # Root gitignore
├── .env.example                     # Environment template
└── README.md                        # This file
```

## 🔌 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |

**Register Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Login Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "color": "#FF5733"
  }
}
```

### Board Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/boards` | Get user's boards | Yes |
| POST | `/api/boards` | Create new board | Yes |
| GET | `/api/boards/:id` | Get board by ID | Yes |
| POST | `/api/boards/join` | Join board by room code | Yes |
| DELETE | `/api/boards/:id` | Delete board | Yes (Owner only) |

**Create Board Request:**
```json
{
  "name": "My Whiteboard",
  "roomCode": "myroom123",
  "isPrivate": false
}
```

**Join Board Request:**
```json
{
  "roomCode": "myroom123"
}
```

## 🔄 Socket.IO Events

### Client → Server Events

| Event | Data | Description |
|-------|------|-------------|
| `join-board` | `{ boardId }` | Join a board room |
| `draw` | `{ boardId, drawing }` | Send drawing data |
| `cursor-move` | `{ boardId, x, y }` | Send cursor position |
| `clear-canvas` | `{ boardId }` | Clear all drawings |
| `undo` | `{ boardId }` | Undo last drawing |
| `request-board-state` | `{ boardId }` | Request current board state |
| `request-messages` | `{ boardId }` | Request all messages |
| `send-message` | `{ boardId, text }` | Send chat message |
| `edit-message` | `{ boardId, messageId, newText }` | Edit message |
| `delete-message` | `{ boardId, messageId }` | Delete message |
| `pin-message` | `{ boardId, messageId, isPinned }` | Pin/unpin message |

### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `board-state` | `{ drawings, users }` | Current board state |
| `draw` | `{ drawing }` | Drawing from another user |
| `canvas-cleared` | - | Canvas cleared by someone |
| `drawing-removed` | - | Drawing removed (undo) |
| `all-messages` | `[messages]` | All chat messages |
| `new-message` | `{ message }` | New chat message |
| `message-updated` | `{ messageId, newText }` | Message edited |
| `message-deleted` | `{ messageId }` | Message deleted |
| `message-pinned` | `{ messageId, isPinned }` | Message pinned/unpinned |
| `user-joined` | `{ user }` | User joined board |
| `user-left` | `{ socketId }` | User left board |
| `cursor-move` | `{ userId, x, y, ... }` | Other user's cursor |
| `error` | `{ message }` | Error message |

## 🎮 How to Use

### 1. Register/Login
- Create an account or login with existing credentials
- Your user will be assigned a random color

### 2. Create or Join a Board
- **Create Board**: Enter board name and unique room code
- **Join Board**: Enter an existing room code to join

### 3. Drawing
- Select a tool from the toolbar (Pen, Line, Rectangle, Circle, Eraser)
- Choose a color from the color picker
- Adjust stroke width using the slider
- Draw on the canvas
- Use Undo to remove your last drawing
- Click Clear to remove all drawings (with confirmation)

### 4. Chatting
- Type your message in the chat panel (slide out from right)
- Click Send or press Enter
- Edit your messages: Hover and click ✏️
- Delete your messages: Hover and click 🗑️
- Pin important messages: Hover and click 📌
- Pinned messages appear at the top

### 5. Collaboration
- See other users in the user list
- Watch their cursors move in real-time
- All drawings and messages sync instantly

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running:
# macOS/Linux:
sudo systemctl status mongod

# Or check the process:
ps aux | grep mongod
```

### Port Already in Use
```bash
# Kill process on port 5000:
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Socket.IO Connection Failed
- Check if backend is running on correct port
- Verify `VITE_SOCKET_URL` in client/.env matches server URL
- Check browser console for CORS errors

### Drawings Not Syncing
- Open browser console (F12)
- Check for errors
- Verify Socket.IO connection status
- Check network tab for WebSocket connection

### Chat Messages Not Appearing
- Verify MongoDB is running
- Check server console for errors
- Ensure user is authenticated
- Check board model has `messages` array

## 🚀 Deployment

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Database Access → Add Database User
4. Network Access → Add IP Address (0.0.0.0/0 for all IPs)
5. Connect → Get connection string
6. Update `MONGODB_URI` with your connection string

### Backend Deployment (Render)

1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. New → Web Service
4. Connect GitHub repository
5. Settings:
   - **Name**: your-whiteboard-api
   - **Root Directory**: `server` (if server is in subfolder)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Environment Variables (Add all from server/.env):
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_generated_secret
   FRONTEND_URL=https://your-frontend-url.vercel.app
   PORT=5000
   ```
7. Click "Create Web Service"

### Frontend Deployment (Vercel)

1. Go to [Vercel.com](https://vercel.com)
2. Import Git Repository
3. Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```
5. Click "Deploy"

### Alternative: Frontend on Render

1. Render → New → Static Site
2. Connect repository
3. Settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables
5. Deploy

## 📝 Environment Variables Reference

### Development

**Server (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/whiteboard
JWT_SECRET=dev_secret_key_change_in_production
FRONTEND_URL=http://localhost:5173
```

**Client (.env):**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Production

**Server:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/whiteboard
JWT_SECRET=strong_random_production_secret
FRONTEND_URL=https://your-app.vercel.app
```

**Client:**
```env
VITE_API_URL=https://your-api.onrender.com
VITE_SOCKET_URL=https://your-api.onrender.com
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Your Name
- GitHub: [@your-username](https://github.com/Ajithkumart1)
- Email: ajithkumart111@gmail.com

## 🙏 Acknowledgments

- Socket.io for real-time communication
- MongoDB for data persistence
- React team for the amazing library
- Tailwind CSS for beautiful styling

## 📞 Support

For support, email ajithkumart111@gmail.com or create an issue in the repository.

---

Made with ❤️ by AJITH KUMAR