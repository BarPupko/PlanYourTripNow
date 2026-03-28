import { useState, useEffect, useRef } from 'react';

const CHAR_INTERVAL_MS = 60;   // speed per character
const REPLAY_EVERY_MS  = 30000; // restart every 30 seconds

const TypewriterGreeting = ({ name }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const fullText = `Hello ${name}, today is ${dateStr}`;

  const [displayed, setDisplayed] = useState('');
  const indexRef  = useRef(0);
  const timerRef  = useRef(null);
  const replayRef = useRef(null);

  const startTyping = () => {
    indexRef.current = 0;
    setDisplayed('');
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(fullText.slice(0, indexRef.current));
      if (indexRef.current >= fullText.length) {
        clearInterval(timerRef.current);
      }
    }, CHAR_INTERVAL_MS);
  };

  useEffect(() => {
    startTyping();

    replayRef.current = setInterval(() => {
      startTyping();
    }, REPLAY_EVERY_MS);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(replayRef.current);
    };
  }, [fullText]); // re-run if name changes

  return (
    <span className="font-medium text-gray-800">
      {displayed}
      <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 align-middle animate-pulse" />
    </span>
  );
};

export default TypewriterGreeting;
