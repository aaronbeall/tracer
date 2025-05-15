import React from 'react';

interface ColorSwatchProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, onChange }) => {
  return (
    <div className="w-8 h-8 overflow-hidden relative rounded-full flex-none">
      <input
        value={color}
        onChange={(e) => onChange(e.target.value)}
        type="color"
        className="w-full h-full cursor-pointer scale-150"
      />
    </div>
  );
};

export default ColorSwatch;