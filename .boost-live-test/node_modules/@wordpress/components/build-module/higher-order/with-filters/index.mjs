// packages/components/src/higher-order/with-filters/index.tsx
import { Component } from "@wordpress/element";
import { addAction, applyFilters, removeAction } from "@wordpress/hooks";
import { createHigherOrderComponent, debounce } from "@wordpress/compose";
import { jsx as _jsx } from "react/jsx-runtime";
var ANIMATION_FRAME_PERIOD = 16;
function withFilters(hookName) {
  return createHigherOrderComponent((OriginalComponent) => {
    const namespace = "core/with-filters/" + hookName;
    let FilteredComponent;
    function ensureFilteredComponent() {
      if (FilteredComponent === void 0) {
        FilteredComponent = applyFilters(hookName, OriginalComponent);
      }
    }
    class FilteredComponentRenderer extends Component {
      constructor(props) {
        super(props);
        ensureFilteredComponent();
      }
      componentDidMount() {
        FilteredComponentRenderer.instances.push(this);
        if (FilteredComponentRenderer.instances.length === 1) {
          addAction("hookRemoved", namespace, onHooksUpdated);
          addAction("hookAdded", namespace, onHooksUpdated);
        }
      }
      componentWillUnmount() {
        FilteredComponentRenderer.instances = FilteredComponentRenderer.instances.filter((instance) => instance !== this);
        if (FilteredComponentRenderer.instances.length === 0) {
          removeAction("hookRemoved", namespace);
          removeAction("hookAdded", namespace);
        }
      }
      render() {
        return /* @__PURE__ */ _jsx(FilteredComponent, {
          ...this.props
        });
      }
    }
    FilteredComponentRenderer.instances = [];
    const throttledForceUpdate = debounce(() => {
      FilteredComponent = applyFilters(hookName, OriginalComponent);
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
export {
  withFilters as default
};
//# sourceMappingURL=index.mjs.map
