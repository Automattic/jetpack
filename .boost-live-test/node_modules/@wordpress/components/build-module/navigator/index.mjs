// packages/components/src/navigator/index.tsx
import { Navigator as TopLevelNavigator } from "./navigator/component.mjs";
import { NavigatorScreen } from "./navigator-screen/component.mjs";
import { NavigatorButton } from "./navigator-button/component.mjs";
import { NavigatorBackButton } from "./navigator-back-button/component.mjs";
import { useNavigator } from "./use-navigator.mjs";
var Navigator = Object.assign(TopLevelNavigator, {
  /**
   * The `Navigator.Screen` component represents a single view/screen/panel and
   * should be used in combination with the `Navigator`, the `Navigator.Button`
   * and the `Navigator.BackButton` components.
   *
   * @example
   * ```jsx
   * import { Navigator } from '@wordpress/components';
   *
   * const MyNavigation = () => (
   *   <Navigator initialPath="/">
   *     <Navigator.Screen path="/">
   *       <p>This is the home screen.</p>
   *        <Navigator.Button path="/child">
   *          Navigate to child screen.
   *       </Navigator.Button>
   *     </Navigator.Screen>
   *
   *     <Navigator.Screen path="/child">
   *       <p>This is the child screen.</p>
   *       <Navigator.BackButton>
   *         Go back
   *       </Navigator.BackButton>
   *     </Navigator.Screen>
   *   </Navigator>
   * );
   * ```
   */
  Screen: Object.assign(NavigatorScreen, {
    displayName: "Navigator.Screen"
  }),
  /**
   * The `Navigator.Button` component can be used to navigate to a screen and
   * should be used in combination with the `Navigator`, the `Navigator.Screen`
   * and the `Navigator.BackButton` components.
   *
   * @example
   * ```jsx
   * import { Navigator } from '@wordpress/components';
   *
   * const MyNavigation = () => (
   *   <Navigator initialPath="/">
   *     <Navigator.Screen path="/">
   *       <p>This is the home screen.</p>
   *        <Navigator.Button path="/child">
   *          Navigate to child screen.
   *       </Navigator.Button>
   *     </Navigator.Screen>
   *
   *     <Navigator.Screen path="/child">
   *       <p>This is the child screen.</p>
   *       <Navigator.BackButton>
   *         Go back
   *       </Navigator.BackButton>
   *     </Navigator.Screen>
   *   </Navigator>
   * );
   * ```
   */
  Button: Object.assign(NavigatorButton, {
    displayName: "Navigator.Button"
  }),
  /**
   * The `Navigator.BackButton` component can be used to navigate to a screen and
   * should be used in combination with the `Navigator`, the `Navigator.Screen`
   * and the `Navigator.Button` components.
   *
   * @example
   * ```jsx
   * import { Navigator } from '@wordpress/components';
   *
   * const MyNavigation = () => (
   *   <Navigator initialPath="/">
   *     <Navigator.Screen path="/">
   *       <p>This is the home screen.</p>
   *        <Navigator.Button path="/child">
   *          Navigate to child screen.
   *       </Navigator.Button>
   *     </Navigator.Screen>
   *
   *     <Navigator.Screen path="/child">
   *       <p>This is the child screen.</p>
   *       <Navigator.BackButton>
   *         Go back
   *       </Navigator.BackButton>
   *     </Navigator.Screen>
   *   </Navigator>
   * );
   * ```
   */
  BackButton: Object.assign(NavigatorBackButton, {
    displayName: "Navigator.BackButton"
  })
});
export {
  Navigator,
  useNavigator
};
//# sourceMappingURL=index.mjs.map
