// packages/components/src/navigator/legacy.ts
import { Navigator as InternalNavigator } from "./navigator/component.mjs";
import { NavigatorScreen as InternalNavigatorScreen } from "./navigator-screen/component.mjs";
import { NavigatorButton as InternalNavigatorButton } from "./navigator-button/component.mjs";
import { NavigatorBackButton as InternalNavigatorBackButton } from "./navigator-back-button/component.mjs";
import { NavigatorToParentButton as InternalNavigatorToParentButton } from "./navigator-to-parent-button/component.mjs";
import { useNavigator } from "./use-navigator.mjs";
var NavigatorProvider = Object.assign(InternalNavigator, {
  displayName: "NavigatorProvider"
});
var NavigatorScreen = Object.assign(InternalNavigatorScreen, {
  displayName: "NavigatorScreen"
});
var NavigatorButton = Object.assign(InternalNavigatorButton, {
  displayName: "NavigatorButton"
});
var NavigatorBackButton = Object.assign(InternalNavigatorBackButton, {
  displayName: "NavigatorBackButton"
});
var NavigatorToParentButton = Object.assign(InternalNavigatorToParentButton, {
  displayName: "NavigatorToParentButton"
});
export {
  NavigatorBackButton,
  NavigatorButton,
  NavigatorProvider,
  NavigatorScreen,
  NavigatorToParentButton,
  useNavigator
};
//# sourceMappingURL=legacy.mjs.map
