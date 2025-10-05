// frontend/src/components/Toolbar.jsx - COMPLETE VERSION
import { useState } from 'react';

const Toolbar = ({ 
  currentTool, 
  setCurrentTool, 
  currentColor, 
  setCurrentColor,
  strokeWidth,
  setStrokeWidth,
  onClear,
  onUndo,
  onExportPNG,
  onExportPDF 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const tools = [
    { id: 'pen', name: 'Pen', icon: '✏️' },
    { id: 'line', name: 'Line', icon: '📏' },
    { id: 'rectangle', name: 'Rectangle', icon: '⬜' },
    { id: 'circle', name: 'Circle', icon: '⭕' },
    { id: 'eraser', name: 'Eraser', icon: '🧹' },
  ];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#808080'
  ];

  return (
    <div className="bg-white border-b border-gray-300 p-4 shadow-md">
      <div className="flex items-center gap-4 flex-wrap">
        
        {/* Tools */}
        <div className="flex gap-2 border-r pr-4">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setCurrentTool(tool.id)}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentTool === tool.id
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={tool.name}
            >
              <span className="text-xl">{tool.icon}</span>
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="relative border-r pr-4">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <div
              className="w-6 h-6 rounded border-2 border-gray-300"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-sm font-medium">Color</span>
          </button>

          {showColorPicker && (
            <div className="absolute top-full mt-2 bg-white p-3 rounded-lg shadow-xl border z-50">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setCurrentColor(color);
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded border-2 hover:scale-110 transition ${
                      currentColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-2 border-r pr-4">
          <label className="text-sm font-medium">Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm w-8">{strokeWidth}px</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          >
            ↶ Undo
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            🗑️ Clear
          </button>
          
          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              📥 Export
            </button>
            
            {showExportMenu && (
              <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border z-50 min-w-[150px]">
                <button
                  onClick={() => {
                    onExportPNG();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg"
                >
                  📷 PNG Image
                </button>
                <button
                  onClick={() => {
                    onExportPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg"
                >
                  📄 PDF Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;