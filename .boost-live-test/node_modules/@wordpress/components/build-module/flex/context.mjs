// packages/components/src/flex/context.ts
import { createContext, useContext } from "@wordpress/element";
var FlexContext = createContext({
  flexItemDisplay: void 0
});
var useFlexContext = () => useContext(FlexContext);
export {
  FlexContext,
  useFlexContext
};
//# sourceMappingURL=context.mjs.map
