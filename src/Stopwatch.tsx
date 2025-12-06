import { useEffect, useRef, useState } from "react";

const TIME_INTERVAL: number = 100;

export const getTimeString = (time: number) => {
  if (time < 0) {
    return "--.--";
  }
  return `${Math.floor(time / TIME_INTERVAL * 10)}.${(time % (TIME_INTERVAL / 10))}`;
};

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

  return { elapsedTime, startTimer, stopTimer, resetTimer };
}
