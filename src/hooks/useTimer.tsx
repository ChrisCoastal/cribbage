import { useRef, useEffect } from 'react';

type T = any;

export const useTimer = (callback: T, delay: number | null = 0) => {
  const savedCallback: React.MutableRefObject<T> = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    const tick = () => {
      savedCallback.current();
    };

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};
