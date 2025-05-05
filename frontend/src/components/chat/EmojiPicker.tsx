import React from 'react';
import { Button } from '../ui/button';

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🥍'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲'],
  objects: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘']
};

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiClick }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = React.useState<keyof typeof EMOJI_CATEGORIES>('smileys');

  return (
    <div className="bg-background border rounded-lg shadow-lg p-2 w-64">
      <div className="flex overflow-x-auto mb-2 pb-1">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "ghost"}
            size="sm"
            className="flex-shrink-0 px-2 py-1 text-xs"
            onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
          >
            {category}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEmojiClick(emoji)}
          >
            {emoji}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default EmojiPicker;
