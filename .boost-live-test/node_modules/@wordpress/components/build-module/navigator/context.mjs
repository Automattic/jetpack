// packages/components/src/navigator/context.ts
import { createContext } from "@wordpress/element";
var initialContextValue = {
  location: {},
  goTo: () => {
  },
  goBack: () => {
  },
  goToParent: () => {
  },
  addScreen: () => {
  },
  removeScreen: () => {
  },
  params: {}
};
var NavigatorContext = createContext(initialContextValue);
NavigatorContext.displayName = "NavigatorContext";
export {
  NavigatorContext
};
//# sourceMappingURL=context.mjs.map
