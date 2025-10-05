// backend/models/Board.js - FIXED & ENHANCED VERSION
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    }
  },
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  edited: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  }
});

const drawingSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    // ENHANCED: Added triangle, arrow, sticky
    enum: ['freehand', 'line', 'rectangle', 'circle', 'text', 'eraser', 'triangle', 'arrow', 'sticky']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  color: {
    type: String,
    default: '#000000'
  },
  strokeWidth: {
    type: Number,
    default: 2
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// NEW: Version History Schema (Limited to 5 versions)
const versionSchema = new mongoose.Schema({
  drawings: [drawingSchema],
  savedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // FIXED: Use 'owner' consistently
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // NEW: Room code for joining
  roomCode: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  // NEW: Permissions system
  permissions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer', 'commenter'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  drawings: [drawingSchema],
  messages: [messageSchema],
  // NEW: Version history (max 5 versions)
  versions: {
    type: [versionSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'Maximum 5 versions allowed'
    }
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
boardSchema.index({ owner: 1, createdAt: -1 });
boardSchema.index({ collaborators: 1 });
boardSchema.index({ roomCode: 1 }, { unique: true });

// ENHANCED: Clean up old messages AND limit versions
boardSchema.pre('save', function(next) {
  // Skip validation if we're just updating drawings
  if (this.isModified('drawings') && !this.isNew) {
    this.$locals.skipValidation = true;
  }
  
  // Clean up messages older than 24 hours
  if (this.messages) {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    this.messages = this.messages.filter(msg => {
      const age = now - new Date(msg.timestamp).getTime();
      return age < ONE_DAY;
    });
  }
  
  // Keep only last 5 versions
  if (this.versions && this.versions.length > 5) {
    this.versions = this.versions.slice(-5);
  }
  
  next();
});

// NEW: Helper methods for permissions
boardSchema.methods.getUserRole = function(userId) {
  if (this.owner.equals(userId)) {
    return 'owner';
  }
  
  const permission = this.permissions.find(p => p.userId.equals(userId));
  return permission ? permission.role : null;
};

boardSchema.methods.canEdit = function(userId) {
  const role = this.getUserRole(userId);
  return ['owner', 'editor'].includes(role);
};

boardSchema.methods.canView = function(userId) {
  const role = this.getUserRole(userId);
  return role !== null || !this.isPrivate;
};

boardSchema.methods.canComment = function(userId) {
  const role = this.getUserRole(userId);
  return ['owner', 'editor', 'commenter'].includes(role);
};

// NEW: Save current state as version
boardSchema.methods.saveVersion = function(userId) {
  const version = {
    drawings: this.drawings,
    savedBy: userId,
    timestamp: new Date()
  };
  
  this.versions.push(version);
  
  // Keep only last 5
  if (this.versions.length > 5) {
    this.versions = this.versions.slice(-5);
  }
};

module.exports = mongoose.model('Board', boardSchema);