import { useState, useEffect, useRef, useCallback } from 'react';

function useTimer(initialTime = 0, onTimeUp = null) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Update the callback ref when it changes
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Start the timer
  const start = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [timeLeft]);

  // Pause the timer
  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  // Resume the timer
  const resume = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [timeLeft]);

  // Stop the timer
  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  // Reset the timer
  const reset = useCallback((newTime = initialTime) => {
    setTimeLeft(newTime);
    setIsRunning(false);
    setIsPaused(false);
  }, [initialTime]);

  // Add time to the timer
  const addTime = useCallback((seconds) => {
    setTimeLeft(prev => Math.max(0, prev + seconds));
  }, []);

  // Set new time
  const setTime = useCallback((seconds) => {
    setTimeLeft(Math.max(0, seconds));
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            setIsPaused(false);
            if (onTimeUpRef.current) {
              onTimeUpRef.current();
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format time for display
  const formatTime = useCallback((seconds = timeLeft) => {
    if (seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Get time in different formats
  const getTimeInMinutes = useCallback(() => {
    return Math.ceil(timeLeft / 60);
  }, [timeLeft]);

  const getTimeInHours = useCallback(() => {
    return Math.ceil(timeLeft / 3600);
  }, [timeLeft]);

  // Check if time is running low (less than 10% of initial time or 60 seconds)
  const isTimeRunningLow = useCallback(() => {
    const threshold = Math.min(initialTime * 0.1, 60);
    return timeLeft <= threshold && timeLeft > 0;
  }, [timeLeft, initialTime]);

  // Check if time is critical (less than 30 seconds)
  const isTimeCritical = useCallback(() => {
    return timeLeft <= 30 && timeLeft > 0;
  }, [timeLeft]);

  return {
    timeLeft,
    isRunning,
    isPaused,
    isTimeUp: timeLeft === 0,
    isTimeRunningLow: isTimeRunningLow(),
    isTimeCritical: isTimeCritical(),
    start,
    pause,
    resume,
    stop,
    reset,
    addTime,
    setTime,
    formatTime,
    getTimeInMinutes,
    getTimeInHours,
  };
}

export default useTimer;