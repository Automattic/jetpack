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

// packages/components/src/navigator/index.tsx
var navigator_exports = {};
__export(navigator_exports, {
  Navigator: () => Navigator,
  useNavigator: () => import_use_navigator.useNavigator
});
module.exports = __toCommonJS(navigator_exports);
var import_component = require("./navigator/component.cjs");
var import_component2 = require("./navigator-screen/component.cjs");
var import_component3 = require("./navigator-button/component.cjs");
var import_component4 = require("./navigator-back-button/component.cjs");
var import_use_navigator = require("./use-navigator.cjs");
var Navigator = Object.assign(import_component.Navigator, {
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
  Screen: Object.assign(import_component2.NavigatorScreen, {
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
  Button: Object.assign(import_component3.NavigatorButton, {
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
  BackButton: Object.assign(import_component4.NavigatorBackButton, {
    displayName: "Navigator.BackButton"
  })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Navigator,
  useNavigator
});
//# sourceMappingURL=index.cjs.map
