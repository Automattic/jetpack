// packages/components/src/context/get-styled-class-name-from-key.ts
import { paramCase as kebabCase } from "change-case";
import memoize from "memize";
function getStyledClassName(namespace) {
  const kebab = kebabCase(namespace);
  return `components-${kebab}`;
}
var getStyledClassNameFromKey = memoize(getStyledClassName);
export {
  getStyledClassNameFromKey
};
//# sourceMappingURL=get-styled-class-name-from-key.mjs.map
