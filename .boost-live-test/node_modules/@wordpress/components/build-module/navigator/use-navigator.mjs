// packages/components/src/navigator/use-navigator.ts
import { useContext } from "@wordpress/element";
import { NavigatorContext } from "./context.mjs";
function useNavigator() {
  const {
    location,
    params,
    goTo,
    goBack,
    goToParent
  } = useContext(NavigatorContext);
  return {
    location,
    goTo,
    goBack,
    goToParent,
    params
  };
}
export {
  useNavigator
};
//# sourceMappingURL=use-navigator.mjs.map
