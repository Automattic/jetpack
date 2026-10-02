/**
 * Adds an event listener and returns a cleanup function to remove it.
 */

export function addEventListener(target, type, listener, options) {
  target.addEventListener(type, listener, options);
  return () => {
    target.removeEventListener(type, listener, options);
  };
}