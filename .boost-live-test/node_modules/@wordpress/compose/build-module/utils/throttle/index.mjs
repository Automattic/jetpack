// packages/compose/src/utils/throttle/index.ts
import { debounce } from "../debounce/index.mjs";
var throttle = (func, wait, options) => {
  let leading = true;
  let trailing = true;
  if (options) {
    leading = "leading" in options ? !!options.leading : leading;
    trailing = "trailing" in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait
  });
};
export {
  throttle
};
//# sourceMappingURL=index.mjs.map
