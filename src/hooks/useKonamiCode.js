import { useEffect, useCallback } from 'react';

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/**
 * Custom hook to detect the Konami Code key sequence
 * @param {Function} callback - Function to execute when Konami Code is entered
 */
export const useKonamiCode = (callback) => {
  const handleKeySequence = useCallback(() => {
    let currentIndex = 0;

    const keyHandler = (event) => {
      const key = event.key;

      // Check if the pressed key matches the next key in the sequence
      if (key === KONAMI_CODE[currentIndex]) {
        currentIndex++;

        // If we've matched the entire sequence
        if (currentIndex === KONAMI_CODE.length) {
          callback();
          currentIndex = 0; // Reset for next time
        }
      } else {
        // Reset if wrong key is pressed
        currentIndex = 0;
      }
    };

    return keyHandler;
  }, [callback]);

  useEffect(() => {
    const keyHandler = handleKeySequence();
    window.addEventListener('keydown', keyHandler);

    return () => {
      window.removeEventListener('keydown', keyHandler);
    };
  }, [handleKeySequence]);
};
