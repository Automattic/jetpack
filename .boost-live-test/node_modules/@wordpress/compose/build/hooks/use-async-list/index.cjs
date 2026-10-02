"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/compose/src/hooks/use-async-list/index.ts
var use_async_list_exports = {};
__export(use_async_list_exports, {
  default: () => use_async_list_default
});
module.exports = __toCommonJS(use_async_list_exports);
var import_element = require("@wordpress/element");
var import_priority_queue = require("@wordpress/priority-queue");
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
  const [current, setCurrent] = (0, import_element.useState)([]);
  (0, import_element.useEffect)(() => {
    let firstItems = getFirstItemsPresentInState(list, current);
    if (firstItems.length < step) {
      firstItems = firstItems.concat(
        list.slice(firstItems.length, step)
      );
    }
    setCurrent(firstItems);
    const asyncQueue = (0, import_priority_queue.createQueue)();
    for (let i = firstItems.length; i < list.length; i += step) {
      asyncQueue.add({}, () => {
        (0, import_element.flushSync)(() => {
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
//# sourceMappingURL=index.cjs.map
