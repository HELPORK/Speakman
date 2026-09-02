import React from 'react';

const EMOJIS = [
  '😀', '😂', '😍', '🥰', '😎', '🤔', '😅', '😊',
  '🙌', '👏', '👍', '👎', '🔥', '✨', '🎉', '💯',
  '❤️', '💚', '💛', '💜', '🖤', '💔', '😢', '😮',
  '😴', '🤯', '🥳', '😇', '🤗', '🙏', '👀', '💪',
  '🌟', '⚡', '☀️', '🌈', '🍀', '🌸', '🎶', '📸',
  '🚀', '💡', '✅', '❌', '⭐', '🐶', '🐱', '☕',
];

export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <div className="emoji-popover" onClick={(e) => e.stopPropagation()}>
      <div className="emoji-grid">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className="emoji-btn"
            onClick={() => {
              onSelect(e);
              onClose?.();
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
