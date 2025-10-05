const UserList = ({ users }) => {
  return (
    <div className="fixed right-4 top-20 bg-white rounded-lg shadow-xl p-4 w-64 border">
      <h3 className="text-lg font-bold mb-3">Online Users ({users.length})</h3>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.socketId}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-sm font-medium">{user.username}</span>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No other users online
          </p>
        )}
      </div>
    </div>
  );
};

export { UserList };