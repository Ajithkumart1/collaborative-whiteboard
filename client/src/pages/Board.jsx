// src/pages/Board.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import { UserList } from '../components/UserList';
import Chat from '../components/Chat';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Board = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchBoard();
  }, [id]);

  useEffect(() => {
    if (!socket || !connected) return;

    // Join the board room
    socket.emit('join-board', { boardId: id });

    // Listen for users joining/leaving
    socket.on('user-joined', (user) => {
      setUsers(prev => [...prev, user]);
    });

    socket.on('user-left', ({ socketId }) => {
      setUsers(prev => prev.filter(u => u.socketId !== socketId));
    });

    socket.on('board-state', ({ users: boardUsers }) => {
      setUsers(boardUsers);
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('board-state');
    };
  }, [socket, connected, id]);

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/boards/${id}`);
      setBoard(data.board);
    } catch (error) {
      console.error('Error fetching board:', error);
      alert('Failed to load board');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (!socket) return;
    
    if (window.confirm('Are you sure you want to clear the entire canvas?')) {
      socket.emit('clear-canvas', { boardId: id });
    }
  };

  const handleUndo = () => {
    if (!socket) return;
    socket.emit('undo', { boardId: id });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading board...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-red-600">Board not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Board Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 font-semibold"
          >
            ← Back to Boards
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{board.name}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        onClear={handleClear}
        onUndo={handleUndo}
      />

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas
          socket={socket}
          boardId={id}
          currentTool={currentTool}
          currentColor={currentColor}
          strokeWidth={strokeWidth}
        />
        
        {/* User List */}
        <UserList users={users} />

        {/* Chat Component */}
        <Chat 
          socket={socket} 
          boardId={id} 
          currentUser={user}
        />
      </div>
    </div>
  );
};

export default Board;