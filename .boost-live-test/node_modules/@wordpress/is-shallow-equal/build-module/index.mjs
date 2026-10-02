// packages/is-shallow-equal/src/index.ts
import isShallowEqualObjects from "./objects.mjs";
import isShallowEqualArrays from "./arrays.mjs";
function isShallowEqual(a, b) {
  if (a && b) {
    if (a.constructor === Object && b.constructor === Object) {
      return isShallowEqualObjects(a, b);
    } else if (Array.isArray(a) && Array.isArray(b)) {
      return isShallowEqualArrays(a, b);
    }
  }
  return a === b;
}
export {
  isShallowEqual as default,
  isShallowEqual,
  isShallowEqualArrays,
  isShallowEqualObjects
};
//# sourceMappingURL=index.mjs.map
