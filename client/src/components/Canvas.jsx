// src/components/Canvas.jsx
import { useEffect, useRef, useState } from 'react';

const Canvas = ({ socket, boardId, currentTool, currentColor, strokeWidth }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null); // ✅ Changed to useRef instead of useState
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState(new Map());

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx; // ✅ Store in ref
    
    console.log('✅ Canvas initialized');
  }, []);

  // Socket listeners - now properly waits for context
  useEffect(() => {
    if (!socket || !contextRef.current) {
      console.log('❌ Socket or context not ready');
      return;
    }

    console.log('🔌 Setting up socket listeners for boardId:', boardId);

    // Listen for drawing events
    const handleDraw = (drawing) => {
      console.log('📥 Received drawing from another user:', drawing.type);
      drawOnCanvas(drawing);
    };

    // Listen for board state
    const handleBoardState = ({ drawings }) => {
      console.log('📋 Received board state with', drawings?.length || 0, 'drawings');
      
      // Clear canvas first
      clearCanvas();
      
      // Redraw all drawings
      if (drawings && drawings.length > 0) {
        // Small delay to ensure canvas is cleared
        setTimeout(() => {
          drawings.forEach((drawing, index) => {
            console.log(`Drawing ${index + 1}:`, drawing.type);
            drawOnCanvas(drawing);
          });
        }, 10);
      }
    };

    // Listen for canvas clear
    const handleCanvasClear = () => {
      console.log('🗑️ Canvas cleared');
      clearCanvas();
    };

    // Listen for drawing removed (undo)
    const handleDrawingRemoved = () => {
      console.log('↩️ Drawing removed, requesting fresh state');
      socket.emit('request-board-state', { boardId });
    };

    // Listen for cursor movements
    const handleCursorMove = (data) => {
      setRemoteCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(data.socketId, data);
        return newCursors;
      });

      setTimeout(() => {
        setRemoteCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.delete(data.socketId);
          return newCursors;
        });
      }, 2000);
    };

    socket.on('draw', handleDraw);
    socket.on('board-state', handleBoardState);
    socket.on('canvas-cleared', handleCanvasClear);
    socket.on('drawing-removed', handleDrawingRemoved);
    socket.on('cursor-move', handleCursorMove);

    // Request initial board state
    socket.emit('request-board-state', { boardId });

    return () => {
      console.log('🔌 Cleaning up socket listeners');
      socket.off('draw', handleDraw);
      socket.off('board-state', handleBoardState);
      socket.off('canvas-cleared', handleCanvasClear);
      socket.off('drawing-removed', handleDrawingRemoved);
      socket.off('cursor-move', handleCursorMove);
    };
  }, [socket, boardId, contextRef.current]); // ✅ Added contextRef.current as dependency

  const clearCanvas = () => {
    const ctx = contextRef.current;
    if (!ctx) return;
    console.log('🧹 Clearing canvas');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const drawOnCanvas = (drawing) => {
    const ctx = contextRef.current;
    if (!ctx) {
      console.log('❌ Cannot draw - context not ready');
      return;
    }

    console.log('🎨 Drawing on canvas:', drawing.type, drawing.color);

    ctx.strokeStyle = drawing.color;
    ctx.fillStyle = drawing.color;
    ctx.lineWidth = drawing.strokeWidth || 2;

    switch (drawing.type) {
      case 'freehand':
        drawFreehand(drawing.data, ctx);
        break;
      case 'line':
        drawLine(drawing.data, ctx);
        break;
      case 'rectangle':
        drawRectangle(drawing.data, ctx);
        break;
      case 'circle':
        drawCircle(drawing.data, ctx);
        break;
      case 'text':
        drawText(drawing.data, ctx);
        break;
      default:
        console.log('⚠️ Unknown drawing type:', drawing.type);
    }
  };

  const drawFreehand = (points, ctx = contextRef.current) => {
    if (!points || points.length < 2) {
      console.log('⚠️ Not enough points for freehand:', points?.length);
      return;
    }
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    console.log('✅ Drew freehand with', points.length, 'points');
  };

  const drawLine = ({ x1, y1, x2, y2 }, ctx = contextRef.current) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawRectangle = ({ x, y, width, height, fill }, ctx = contextRef.current) => {
    if (fill) {
      ctx.fillRect(x, y, width, height);
    } else {
      ctx.strokeRect(x, y, width, height);
    }
  };

  const drawCircle = ({ x, y, radius, fill }, ctx = contextRef.current) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    if (fill) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  };

  const drawText = ({ x, y, text, fontSize }, ctx = contextRef.current) => {
    ctx.font = `${fontSize || 16}px Arial`;
    ctx.fillText(text, x, y);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPath([{ x, y }]);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    // Emit cursor position
    if (socket) {
      socket.emit('cursor-move', { boardId, x, y });
    }

    if (!isDrawing) return;

    if (currentTool === 'pen') {
      setCurrentPath(prev => [...prev, { x, y }]);
      
      ctx.lineTo(x, y);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  const handleMouseUp = (e) => {
    const ctx = contextRef.current;
    if (!ctx || !isDrawing) return;
    
    const { x, y } = getCoordinates(e);
    setIsDrawing(false);

    let drawing = {
      color: currentColor,
      strokeWidth: strokeWidth
    };

    switch (currentTool) {
      case 'pen':
        drawing.type = 'freehand';
        drawing.data = [...currentPath, { x, y }];
        console.log('📤 Sending pen drawing with', drawing.data.length, 'points');
        break;

      case 'line':
        drawing.type = 'line';
        drawing.data = {
          x1: startPos.x,
          y1: startPos.y,
          x2: x,
          y2: y
        };
        drawLine(drawing.data, ctx);
        break;

      case 'rectangle':
        drawing.type = 'rectangle';
        drawing.data = {
          x: Math.min(startPos.x, x),
          y: Math.min(startPos.y, y),
          width: Math.abs(x - startPos.x),
          height: Math.abs(y - startPos.y),
          fill: false
        };
        drawRectangle(drawing.data, ctx);
        break;

      case 'circle':
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        drawing.type = 'circle';
        drawing.data = {
          x: startPos.x,
          y: startPos.y,
          radius: radius,
          fill: false
        };
        drawCircle(drawing.data, ctx);
        break;

      case 'eraser':
        drawing.type = 'freehand';
        drawing.color = '#FFFFFF';
        drawing.strokeWidth = strokeWidth * 3;
        drawing.data = [...currentPath, { x, y }];
        break;
    }

    // Emit drawing to server
    if (socket && currentTool !== 'select') {
      console.log('📤 Emitting drawing to server:', drawing.type);
      console.log('Socket connected:', socket.connected);
      console.log('Board ID:', boardId);
      socket.emit('draw', { boardId, drawing });
    } else {
      console.log('❌ Cannot emit - socket:', !!socket, 'tool:', currentTool);
    }

    setCurrentPath([]);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDrawing(false)}
        className="border border-gray-300 cursor-crosshair bg-white"
      />
      
      {/* Remote cursors */}
      {Array.from(remoteCursors.values()).map((cursor) => (
        <div
          key={cursor.socketId}
          className="absolute pointer-events-none transition-all duration-100"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: cursor.color }}
          />
          <div
            className="text-xs font-semibold px-2 py-1 rounded mt-1 whitespace-nowrap"
            style={{ 
              backgroundColor: cursor.color,
              color: '#FFFFFF'
            }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Canvas;