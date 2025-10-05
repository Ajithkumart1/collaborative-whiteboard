// backend/socket/socketHandler.js - ENHANCED VERSION
const Board = require('../models/Board');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Store active users per room
const activeUsers = new Map();

const socketHandler = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    // ==================== BOARD HANDLERS ====================

    // Join board room
    socket.on('join-board', async ({ boardId }) => {
      try {
        const board = await Board.findById(boardId);
        
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        // NEW: Check permission to view
        if (!board.canView(socket.user._id)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Join the room
        socket.join(boardId);
        socket.currentBoard = boardId;

        // Add user to active users
        if (!activeUsers.has(boardId)) {
          activeUsers.set(boardId, new Map());
        }
        
        const userRole = board.getUserRole(socket.user._id) || 'viewer';
        
        activeUsers.get(boardId).set(socket.id, {
          id: socket.user._id,
          username: socket.user.username,
          color: socket.user.color,
          socketId: socket.id,
          role: userRole // NEW: Include role
        });

        // Send current board state
        socket.emit('board-state', {
          drawings: board.drawings,
          users: Array.from(activeUsers.get(boardId).values()),
          userRole: userRole // NEW: Tell user their role
        });

        // Notify others
        socket.to(boardId).emit('user-joined', {
          id: socket.user._id,
          username: socket.user.username,
          color: socket.user.color,
          socketId: socket.id,
          role: userRole
        });

        console.log(`📋 ${socket.user.username} (${userRole}) joined board: ${boardId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle drawing events
    socket.on('draw', async (drawData) => {
      try {
        const { boardId, drawing } = drawData;

        console.log('📥 Received draw from', socket.user.username, '- Type:', drawing.type);

        if (!socket.currentBoard || socket.currentBoard !== boardId) {
          console.log('❌ User not in correct board');
          return;
        }

        const board = await Board.findById(boardId);
        
        // NEW: Check permission to edit
        if (!board.canEdit(socket.user._id)) {
          socket.emit('error', { message: 'You do not have permission to draw' });
          return;
        }

        // Add user info to drawing
        const drawingWithUser = {
          ...drawing,
          userId: socket.user._id,
          timestamp: new Date()
        };

        // Save to database
        const updatedBoard = await Board.findByIdAndUpdate(
          boardId,
          {
            $push: { drawings: drawingWithUser },
            $set: { updatedAt: new Date() }
          },
          { new: true, runValidators: false }
        );

        console.log('✅ Drawing saved. Total drawings:', updatedBoard.drawings.length);

        // Broadcast to all users in the room EXCEPT sender
        socket.to(boardId).emit('draw', drawingWithUser);

      } catch (error) {
        console.error('Draw error:', error);
        socket.emit('error', { message: 'Failed to save drawing' });
      }
    });

    // Handle cursor movement
    socket.on('cursor-move', ({ boardId, x, y }) => {
      if (socket.currentBoard === boardId) {
        socket.to(boardId).emit('cursor-move', {
          userId: socket.user._id,
          username: socket.user.username,
          color: socket.user.color,
          socketId: socket.id,
          x,
          y
        });
      }
    });

    // Handle clear canvas
    socket.on('clear-canvas', async ({ boardId }) => {
      try {
        if (!socket.currentBoard || socket.currentBoard !== boardId) {
          return;
        }

        const board = await Board.findById(boardId);
        
        // NEW: Only owner or editor can clear
        if (!board.canEdit(socket.user._id)) {
          socket.emit('error', { message: 'You do not have permission to clear canvas' });
          return;
        }

        // Clear drawings from database
        await Board.findByIdAndUpdate(boardId, {
          $set: { 
            drawings: [],
            updatedAt: new Date()
          }
        }, { runValidators: false });

        console.log('🗑️ Canvas cleared by', socket.user.username);
        
        // Notify all users INCLUDING the sender
        io.to(boardId).emit('canvas-cleared');

      } catch (error) {
        console.error('Clear canvas error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle undo
    socket.on('undo', async ({ boardId }) => {
      try {
        if (!socket.currentBoard || socket.currentBoard !== boardId) {
          return;
        }

        const board = await Board.findById(boardId);
        
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        // NEW: Check permission
        if (!board.canEdit(socket.user._id)) {
          socket.emit('error', { message: 'You do not have permission to undo' });
          return;
        }
        
        // Find all drawings by this user
        const userDrawings = board.drawings.filter(d => 
          d.userId && d.userId.toString() === socket.user._id.toString()
        );
        
        if (userDrawings.length > 0) {
          const lastDrawingId = userDrawings[userDrawings.length - 1]._id;
          
          const updatedBoard = await Board.findByIdAndUpdate(
            boardId,
            {
              $pull: { drawings: { _id: lastDrawingId } },
              $set: { updatedAt: new Date() }
            },
            { new: true, runValidators: false }
          );

          console.log('↩️ Undo by', socket.user.username);

          // Notify ALL users to refresh
          io.to(boardId).emit('drawing-removed');
          
          // Send updated board state
          io.to(boardId).emit('board-state', {
            drawings: updatedBoard.drawings,
            users: Array.from(activeUsers.get(boardId)?.values() || [])
          });
        }

      } catch (error) {
        console.error('Undo error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // NEW: Save version (manual snapshot)
    socket.on('save-version', async ({ boardId }) => {
      try {
        const board = await Board.findById(boardId);
        
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        // Only owner can save versions
        if (!board.owner.equals(socket.user._id)) {
          socket.emit('error', { message: 'Only board owner can save versions' });
          return;
        }

        board.saveVersion(socket.user._id);
        await board.save();

        socket.emit('version-saved', { 
          message: 'Version saved successfully',
          totalVersions: board.versions.length
        });

        console.log('💾 Version saved by', socket.user.username);
      } catch (error) {
        console.error('Save version error:', error);
        socket.emit('error', { message: 'Failed to save version' });
      }
    });

    // NEW: Load version
    socket.on('load-version', async ({ boardId, versionIndex }) => {
      try {
        const board = await Board.findById(boardId);
        
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        // Only owner can load versions
        if (!board.owner.equals(socket.user._id)) {
          socket.emit('error', { message: 'Only board owner can load versions' });
          return;
        }

        if (!board.versions[versionIndex]) {
          socket.emit('error', { message: 'Version not found' });
          return;
        }

        // Load drawings from version
        board.drawings = board.versions[versionIndex].drawings;
        await board.save();

        // Notify all users
        io.to(boardId).emit('board-state', {
          drawings: board.drawings,
          users: Array.from(activeUsers.get(boardId)?.values() || [])
        });

        console.log('📂 Version loaded by', socket.user.username);
      } catch (error) {
        console.error('Load version error:', error);
        socket.emit('error', { message: 'Failed to load version' });
      }
    });

    // NEW: Get all versions
    socket.on('request-versions', async ({ boardId }) => {
      try {
        const board = await Board.findById(boardId)
          .populate('versions.savedBy', 'username');
        
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        const versions = board.versions.map((v, index) => ({
          index,
          timestamp: v.timestamp,
          savedBy: v.savedBy?.username || 'Unknown',
          drawingCount: v.drawings.length
        }));

        socket.emit('all-versions', versions);
      } catch (error) {
        console.error('Request versions error:', error);
        socket.emit('error', { message: 'Failed to load versions' });
      }
    });

    // Handle request for board state
    socket.on('request-board-state', async ({ boardId }) => {
      try {
        const board = await Board.findById(boardId);
        if (board) {
          const userRole = board.getUserRole(socket.user._id) || 'viewer';
          
          console.log('📤 Sending board state:', board.drawings.length, 'drawings');
          socket.emit('board-state', {
            drawings: board.drawings,
            users: Array.from(activeUsers.get(boardId)?.values() || []),
            userRole: userRole
          });
        } else {
          socket.emit('error', { message: 'Board not found' });
        }
      } catch (error) {
        console.error('Request board state error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // ==================== MESSAGE HANDLERS ====================
    
    // Request all messages
    socket.on('request-messages', async ({ boardId }) => {
      try {
        const board = await Board.findById(boardId);
        if (board) {
          // Filter out expired messages (older than 24 hours)
          const now = Date.now();
          const validMessages = board.messages.filter(msg => {
            const age = now - new Date(msg.timestamp).getTime();
            return age < 24 * 60 * 60 * 1000;
          });
          
          // Update if messages were filtered
          if (validMessages.length !== board.messages.length) {
            board.messages = validMessages;
            await board.save();
          }
          
          console.log('📤 Sending messages:', validMessages.length);
          socket.emit('all-messages', validMessages);
        }
      } catch (error) {
        console.error('Request messages error:', error);
        socket.emit('error', { message: 'Failed to load messages' });
      }
    });

    // Send new message
    socket.on('send-message', async ({ boardId, text }) => {
      try {
        if (!text || !text.trim()) {
          return;
        }

        const board = await Board.findById(boardId);
        
        // NEW: Check if user can comment
        if (!board.canComment(socket.user._id)) {
          socket.emit('error', { message: 'You do not have permission to send messages' });
          return;
        }

        const message = {
          user: {
            _id: socket.user._id,
            username: socket.user.username,
            color: socket.user.color
          },
          text: text.trim().substring(0, 500),
          timestamp: new Date(),
          edited: false,
          isPinned: false
        };

        const updatedBoard = await Board.findByIdAndUpdate(
          boardId,
          { $push: { messages: message } },
          { new: true }
        );

        const savedMessage = updatedBoard.messages[updatedBoard.messages.length - 1];

        // Broadcast to all users
        io.to(boardId).emit('new-message', savedMessage);

        console.log('💬 Message sent by', socket.user.username);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Edit message
    socket.on('edit-message', async ({ boardId, messageId, newText }) => {
      try {
        if (!newText || !newText.trim()) {
          return;
        }

        const board = await Board.findById(boardId);
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        const message = board.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user owns the message
        if (message.user._id.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Cannot edit others messages' });
          return;
        }

        message.text = newText.trim().substring(0, 500);
        message.edited = true;
        await board.save();

        io.to(boardId).emit('message-updated', {
          messageId,
          newText: message.text
        });

        console.log('✏️ Message edited by', socket.user.username);
      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Delete message
    socket.on('delete-message', async ({ boardId, messageId }) => {
      try {
        const board = await Board.findById(boardId);
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        const message = board.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user owns the message
        if (message.user._id.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Cannot delete others messages' });
          return;
        }

        message.remove();
        await board.save();

        io.to(boardId).emit('message-deleted', { messageId });

        console.log('🗑️ Message deleted by', socket.user.username);
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Pin/Unpin message
    socket.on('pin-message', async ({ boardId, messageId, isPinned }) => {
      try {
        const board = await Board.findById(boardId);
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        // NEW: Only owner can pin
        if (!board.owner.equals(socket.user._id)) {
          socket.emit('error', { message: 'Only board owner can pin messages' });
          return;
        }

        const message = board.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        message.isPinned = isPinned;
        await board.save();

        io.to(boardId).emit('message-pinned', { messageId, isPinned });

        console.log(`📌 Message ${isPinned ? 'pinned' : 'unpinned'} by`, socket.user.username);
      } catch (error) {
        console.error('Pin message error:', error);
        socket.emit('error', { message: 'Failed to pin message' });
      }
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);

      if (socket.currentBoard && activeUsers.has(socket.currentBoard)) {
        activeUsers.get(socket.currentBoard).delete(socket.id);

        socket.to(socket.currentBoard).emit('user-left', {
          id: socket.user._id,
          socketId: socket.id
        });

        if (activeUsers.get(socket.currentBoard).size === 0) {
          activeUsers.delete(socket.currentBoard);
        }
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

module.exports = socketHandler;