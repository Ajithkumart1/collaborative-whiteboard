// src/components/Chat.jsx
import { useState, useEffect, useRef } from 'react';

const Chat = ({ socket, boardId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for message updates
    socket.on('message-updated', ({ messageId, newText }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, text: newText, edited: true } : msg
      ));
    });

    // Listen for message deletions
    socket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    // Listen for pinned message updates
    socket.on('message-pinned', ({ messageId, isPinned }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, isPinned } : msg
      ));
    });

    // Listen for all messages (initial load)
    socket.on('all-messages', (allMessages) => {
      setMessages(allMessages);
    });

    // Request initial messages
    socket.emit('request-messages', { boardId });

    return () => {
      socket.off('new-message');
      socket.off('message-updated');
      socket.off('message-deleted');
      socket.off('message-pinned');
      socket.off('all-messages');
    };
  }, [socket, boardId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('send-message', {
      boardId,
      text: inputMessage.trim()
    });

    setInputMessage('');
  };

  const handleEditMessage = (messageId) => {
    if (!editText.trim()) return;

    socket.emit('edit-message', {
      boardId,
      messageId,
      newText: editText.trim()
    });

    setEditingMessageId(null);
    setEditText('');
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Delete this message?')) {
      socket.emit('delete-message', {
        boardId,
        messageId
      });
    }
  };

  const handlePinMessage = (messageId, currentPinStatus) => {
    socket.emit('pin-message', {
      boardId,
      messageId,
      isPinned: !currentPinStatus
    });
  };

  const startEditing = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // More than 24 hours
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pinnedMessages = messages.filter(msg => msg.isPinned);
  const regularMessages = messages.filter(msg => !msg.isPinned);

  return (
    <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl border-l transition-all duration-300 z-50 ${
      isOpen ? 'w-96' : 'w-12'
    }`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 bg-blue-500 text-white p-3 rounded-l-lg hover:bg-blue-600 shadow-lg"
      >
        {isOpen ? '→' : '💬'}
      </button>

      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-blue-500 text-white p-4 shadow-md">
            <h2 className="text-xl font-bold flex items-center gap-2">
              💬 Chat
              {messages.length > 0 && (
                <span className="text-sm bg-blue-600 px-2 py-1 rounded-full">
                  {messages.length}
                </span>
              )}
            </h2>
          </div>

          {/* Pinned Messages */}
          {pinnedMessages.length > 0 && (
            <div className="bg-yellow-50 border-b p-2 max-h-32 overflow-y-auto">
              <div className="text-xs font-semibold text-yellow-800 mb-1">
                📌 Pinned Messages
              </div>
              {pinnedMessages.map((msg) => (
                <div key={msg._id} className="bg-white p-2 rounded mb-1 text-sm">
                  <div className="font-semibold text-xs" style={{ color: msg.user.color }}>
                    {msg.user.username}
                  </div>
                  <div className="text-gray-700">{msg.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {regularMessages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              regularMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`group relative ${
                    msg.user._id === currentUser?._id
                      ? 'ml-8'
                      : 'mr-8'
                  }`}
                >
                  {editingMessageId === msg._id ? (
                    // Edit Mode
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 border rounded resize-none"
                        rows="2"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEditMessage(msg._id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className={`relative p-3 rounded-lg ${
                      msg.user._id === currentUser?._id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {msg.user.username}
                            </span>
                            {msg.edited && (
                              <span className="text-xs opacity-70">(edited)</span>
                            )}
                          </div>
                          <p className="text-sm break-words">{msg.text}</p>
                          <div className="text-xs opacity-70 mt-1">
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {/* Pin Button - Available to all */}
                          <button
                            onClick={() => handlePinMessage(msg._id, msg.isPinned)}
                            className="p-1 hover:bg-black/10 rounded"
                            title={msg.isPinned ? 'Unpin' : 'Pin message'}
                          >
                            📌
                          </button>

                          {/* Edit/Delete - Only for own messages */}
                          {msg.user._id === currentUser?._id && (
                            <>
                              <button
                                onClick={() => startEditing(msg)}
                                className="p-1 hover:bg-black/10 rounded"
                                title="Edit message"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg._id)}
                                className="p-1 hover:bg-black/10 rounded"
                                title="Delete message"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {inputMessage.length}/500
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;