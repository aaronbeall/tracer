import React, { useState } from 'react';
import { Input } from './input';
import { ChevronsUpDownIcon } from 'lucide-react';

interface AutocompleteProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string; // Added inputClassName prop
}

export const Autocomplete: React.FC<AutocompleteProps> = ({ options, value, onChange, placeholder, className, inputClassName }) => {
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setFilteredOptions(
      options.filter(option => option.toLowerCase().includes(inputValue.toLowerCase()))
    );
    setOpen(true);
    setHighlightedIndex(0); // Reset highlighted index
  };

  const handleFocus = () => {
    if (value.trim() === '') {
      setFilteredOptions(options); // Show all suggestions if input is empty
    }
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter' && open && highlightedIndex >= 0) {
      e.preventDefault();
      onChange(filteredOptions[highlightedIndex]);
      setOpen(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150); // Add a short delay before closing
  };

  const getHighlightedText = (text: string, highlight: string) => {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={index} className="bg-yellow-200 font-semibold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown} // Add keydown handler
          placeholder={placeholder || 'Type to search...'}
          className={`${inputClassName} pr-8`}
          onFocus={handleFocus} // Use the updated focus handler
          onBlur={handleBlur} // Use the delayed blur handler
        />
        <ChevronsUpDownIcon
          onClick={() => setOpen(!open)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 cursor-pointer text-gray-500"
        />
      </div>
      {open && filteredOptions.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100 ${
                index === highlightedIndex ? 'bg-gray-200' : ''
              }`}
            >
              {getHighlightedText(option, value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};