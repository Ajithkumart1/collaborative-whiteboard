const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const auth = require('../middleware/auth');

// Create a new board with room code
router.post('/', auth, async (req, res) => {
  try {
    const { name, roomCode, isPrivate = false } = req.body;

    if (!name || !roomCode) {
      return res.status(400).json({ error: 'Name and room code are required' });
    }

    // Check if room code already exists
    const existingBoard = await Board.findOne({ roomCode: roomCode.toLowerCase() });
    if (existingBoard) {
      return res.status(400).json({ error: 'Room code already taken. Please choose another.' });
    }

    const board = new Board({
      name,
      roomCode: roomCode.toLowerCase(),
      isPrivate,
      owner: req.user._id,
      collaborators: [req.user._id]
    });

    await board.save();
    res.status(201).json({ board });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// Join board by room code
router.post('/join', auth, async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    const board = await Board.findOne({ roomCode: roomCode.toLowerCase() });

    if (!board) {
      return res.status(404).json({ error: 'Room not found. Please check the room code.' });
    }

    // If private, check if user is collaborator
    if (board.isPrivate && !board.collaborators.includes(req.user._id)) {
      return res.status(403).json({ error: 'This is a private room. You need an invitation.' });
    }

    // Add user to collaborators if not already there
    if (!board.collaborators.includes(req.user._id)) {
      board.collaborators.push(req.user._id);
      await board.save();
    }

    res.json({ board });
  } catch (error) {
    console.error('Join board error:', error);
    res.status(500).json({ error: 'Failed to join board' });
  }
});

// Get board by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check access: public boards or user is collaborator
    if (board.isPrivate && !board.collaborators.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ board });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

// Get user's boards
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({
      collaborators: req.user._id
    }).sort({ updatedAt: -1 });

    res.json({ boards });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// Delete board (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can delete this board' });
    }

    await board.deleteOne();
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

module.exports = router;