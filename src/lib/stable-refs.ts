import { useRef, useEffect } from 'react';

/**
 * Creates a stable reference to a function to prevent useEffect dependency issues
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useRef(((...args) => callbackRef.current(...args)) as T).current;
}

/**
 * Creates a stable reference to a value to prevent useEffect dependency issues
 */
export function useStableValue<T>(value: T): T {
  const valueRef = useRef(value);
  
  useEffect(() => {
    valueRef.current = value;
  });
  
  return valueRef.current;
} 