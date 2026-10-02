/**
 * A utility class to manage multiple timeouts.
 */
export class TimeoutManager {
  ids = new Map();
  start = (key, delay, fn) => {
    this.clear(key);
    const id = setTimeout(() => {
      this.ids.delete(key);
      fn();
    }, delay); /* Node.js types are enabled in development */

    this.ids.set(key, id);
  };
  clear = key => {
    const id = this.ids.get(key);
    if (id != null) {
      clearTimeout(id);
      this.ids.delete(key);
    }
  };
  clearAll = () => {
    this.ids.forEach(clearTimeout);
    this.ids.clear();
  };
}