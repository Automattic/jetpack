// packages/components/src/tabs/use-track-overflow.ts
import { useState, useEffect } from "@wordpress/element";
import { useEvent } from "@wordpress/compose";
function useTrackOverflow(parent, children) {
  const [first, setFirst] = useState(false);
  const [last, setLast] = useState(false);
  const [observer, setObserver] = useState();
  const callback = useEvent((entries) => {
    for (const entry of entries) {
      if (entry.target === children.first) {
        setFirst(!entry.isIntersecting);
      }
      if (entry.target === children.last) {
        setLast(!entry.isIntersecting);
      }
    }
  });
  useEffect(() => {
    if (!parent || !window.IntersectionObserver) {
      return;
    }
    const newObserver = new IntersectionObserver(callback, {
      root: parent,
      threshold: 0.9
    });
    setObserver(newObserver);
    return () => newObserver.disconnect();
  }, [callback, parent]);
  useEffect(() => {
    if (!observer) {
      return;
    }
    if (children.first) {
      observer.observe(children.first);
    }
    if (children.last) {
      observer.observe(children.last);
    }
    return () => {
      if (children.first) {
        observer.unobserve(children.first);
      }
      if (children.last) {
        observer.unobserve(children.last);
      }
    };
  }, [children.first, children.last, observer]);
  return {
    first,
    last
  };
}
export {
  useTrackOverflow
};
//# sourceMappingURL=use-track-overflow.mjs.map
