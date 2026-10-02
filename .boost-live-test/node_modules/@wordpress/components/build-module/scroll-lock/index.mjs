// packages/components/src/scroll-lock/index.tsx
import { useEffect } from "@wordpress/element";
var previousScrollTop = 0;
function setLocked(locked) {
  const scrollingElement = document.scrollingElement || document.body;
  if (locked) {
    previousScrollTop = scrollingElement.scrollTop;
  }
  const methodName = locked ? "add" : "remove";
  scrollingElement.classList[methodName]("lockscroll");
  document.documentElement.classList[methodName]("lockscroll");
  if (!locked) {
    scrollingElement.scrollTop = previousScrollTop;
  }
}
var lockCounter = 0;
function ScrollLock() {
  useEffect(() => {
    if (lockCounter === 0) {
      setLocked(true);
    }
    ++lockCounter;
    return () => {
      if (lockCounter === 1) {
        setLocked(false);
      }
      --lockCounter;
    };
  }, []);
  return null;
}
var scroll_lock_default = ScrollLock;
export {
  ScrollLock,
  scroll_lock_default as default
};
//# sourceMappingURL=index.mjs.map
