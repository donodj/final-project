import { useEffect, useRef, useState } from "react";

const TIME_INTERVAL: number = 100;

export function useStopwatch() {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(0);

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, TIME_INTERVAL);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  });

  const startTimer = () => { setIsTimerRunning(true); };

  const stopTimer = () => { setIsTimerRunning(false); };

  const resetTimer = () => {
    stopTimer();
    setElapsedTime(0);
  };

  return { TIME_INTERVAL, isTimerRunning, elapsedTime, startTimer, stopTimer, resetTimer };
}
