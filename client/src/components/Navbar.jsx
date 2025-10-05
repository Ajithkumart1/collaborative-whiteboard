import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            🎨 CollabBoard
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm">
                  Welcome, <strong>{user.username}</strong>
                </span>
                <Link
                  to="/"
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                >
                  My Boards
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export { Navbar };