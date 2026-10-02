// packages/compose/src/hooks/use-async-list/index.ts
import { flushSync, useEffect, useState } from "@wordpress/element";
import { createQueue } from "@wordpress/priority-queue";
function getFirstItemsPresentInState(list, state) {
  const firstItems = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!state.includes(item)) {
      break;
    }
    firstItems.push(item);
  }
  return firstItems;
}
function useAsyncList(list, config = { step: 1 }) {
  const { step = 1 } = config;
  const [current, setCurrent] = useState([]);
  useEffect(() => {
    let firstItems = getFirstItemsPresentInState(list, current);
    if (firstItems.length < step) {
      firstItems = firstItems.concat(
        list.slice(firstItems.length, step)
      );
    }
    setCurrent(firstItems);
    const asyncQueue = createQueue();
    for (let i = firstItems.length; i < list.length; i += step) {
      asyncQueue.add({}, () => {
        flushSync(() => {
          setCurrent((state) => [
            ...state,
            ...list.slice(i, i + step)
          ]);
        });
      });
    }
    return () => asyncQueue.reset();
  }, [list]);
  return current;
}
var use_async_list_default = useAsyncList;
export {
  use_async_list_default as default
};
//# sourceMappingURL=index.mjs.map
