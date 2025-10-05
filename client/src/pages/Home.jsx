// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { JoinBoardModal } from '../components/JoinBoardModal';

const Home = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/boards');
      setBoards(data.boards);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRoomCode = () => {
    // Generate a random room code like "room-abc123"
    const randomCode = Math.random().toString(36).substring(2, 8);
    return `room-${randomCode}`;
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const finalRoomCode = roomCode.trim() || generateRoomCode();
      
      const { data } = await api.post('/boards', {
        name: newBoardName,
        roomCode: finalRoomCode,
        isPrivate: false
      });
      
      navigate(`/board/${data.board._id}`);
    } catch (error) {
      console.error('Error creating board:', error);
      setCreateError(error.response?.data?.error || 'Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinBoard = (board) => {
    navigate(`/board/${board._id}`);
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this board?')) {
      return;
    }

    try {
      await api.delete(`/boards/${boardId}`);
      setBoards(boards.filter(b => b._id !== boardId));
    } catch (error) {
      console.error('Error deleting board:', error);
      alert('Failed to delete board');
    }
  };

  const copyRoomCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Room code "${code}" copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading boards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">My Boards</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Join Room
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              + Create New Room
            </button>
          </div>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No boards yet
            </h2>
            <p className="text-gray-500 mb-6">
              Create a room or join an existing one to start collaborating!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition text-lg"
              >
                Create Room
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-lg"
              >
                Join Room
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <div
                key={board._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 truncate flex-1">
                    {board.name}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded ml-2">
                    {board.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Room Code</p>
                      <p className="font-mono font-bold text-gray-800">{board.roomCode}</p>
                    </div>
                    <button
                      onClick={() => copyRoomCode(board.roomCode)}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                      title="Copy room code"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <p>
                    Last updated:{' '}
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/board/${board._id}`}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-center font-semibold"
                  >
                    Open Board
                  </Link>
                  {board.owner === JSON.parse(localStorage.getItem('user'))?.id && (
                    <button
                      onClick={() => handleDeleteBoard(board._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      title="Delete board"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Create New Room</h2>
            <form onSubmit={handleCreateBoard}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Team Meeting"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Code (optional)
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="my-team-room"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to generate a random code. Others can join using this code.
                </p>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                  {createError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewBoardName('');
                    setRoomCode('');
                    setCreateError('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Board Modal */}
      <JoinBoardModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinBoard}
      />
    </div>
  );
};

export default Home;