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

// packages/components/src/higher-order/with-filters/index.tsx
var with_filters_exports = {};
__export(with_filters_exports, {
  default: () => withFilters
});
module.exports = __toCommonJS(with_filters_exports);
var import_element = require("@wordpress/element");
var import_hooks = require("@wordpress/hooks");
var import_compose = require("@wordpress/compose");
var import_jsx_runtime = require("react/jsx-runtime");
var ANIMATION_FRAME_PERIOD = 16;
function withFilters(hookName) {
  return (0, import_compose.createHigherOrderComponent)((OriginalComponent) => {
    const namespace = "core/with-filters/" + hookName;
    let FilteredComponent;
    function ensureFilteredComponent() {
      if (FilteredComponent === void 0) {
        FilteredComponent = (0, import_hooks.applyFilters)(hookName, OriginalComponent);
      }
    }
    class FilteredComponentRenderer extends import_element.Component {
      constructor(props) {
        super(props);
        ensureFilteredComponent();
      }
      componentDidMount() {
        FilteredComponentRenderer.instances.push(this);
        if (FilteredComponentRenderer.instances.length === 1) {
          (0, import_hooks.addAction)("hookRemoved", namespace, onHooksUpdated);
          (0, import_hooks.addAction)("hookAdded", namespace, onHooksUpdated);
        }
      }
      componentWillUnmount() {
        FilteredComponentRenderer.instances = FilteredComponentRenderer.instances.filter((instance) => instance !== this);
        if (FilteredComponentRenderer.instances.length === 0) {
          (0, import_hooks.removeAction)("hookRemoved", namespace);
          (0, import_hooks.removeAction)("hookAdded", namespace);
        }
      }
      render() {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilteredComponent, {
          ...this.props
        });
      }
    }
    FilteredComponentRenderer.instances = [];
    const throttledForceUpdate = (0, import_compose.debounce)(() => {
      FilteredComponent = (0, import_hooks.applyFilters)(hookName, OriginalComponent);
      FilteredComponentRenderer.instances.forEach((instance) => {
        instance.forceUpdate();
      });
    }, ANIMATION_FRAME_PERIOD);
    function onHooksUpdated(updatedHookName) {
      if (updatedHookName === hookName) {
        throttledForceUpdate();
      }
    }
    return FilteredComponentRenderer;
  }, "withFilters");
}
//# sourceMappingURL=index.cjs.map
