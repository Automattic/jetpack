// packages/components/src/composite/legacy/index.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef } from "@wordpress/element";
import { useInstanceId } from "@wordpress/compose";
import deprecated from "@wordpress/deprecated";
import { Composite as Current } from "../index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function mapLegacyStatePropsToComponentProps(legacyProps) {
  if (legacyProps.state) {
    const {
      state,
      ...rest
    } = legacyProps;
    const {
      store,
      ...props
    } = mapLegacyStatePropsToComponentProps(state);
    return {
      ...rest,
      ...props,
      store
    };
  }
  return legacyProps;
}
var LEGACY_TO_NEW_DISPLAY_NAME = {
  __unstableComposite: "Composite",
  __unstableCompositeGroup: "Composite.Group or Composite.Row",
  __unstableCompositeItem: "Composite.Item",
  __unstableUseCompositeState: "Composite"
};
function proxyComposite(ProxiedComponent, propMap = {}) {
  const displayName = ProxiedComponent.displayName ?? "";
  const Component = (legacyProps) => {
    deprecated(`wp.components.${displayName}`, {
      since: "6.7",
      alternative: LEGACY_TO_NEW_DISPLAY_NAME.hasOwnProperty(displayName) ? LEGACY_TO_NEW_DISPLAY_NAME[displayName] : void 0
    });
    const {
      store,
      ...rest
    } = mapLegacyStatePropsToComponentProps(legacyProps);
    let props = rest;
    props = {
      ...props,
      id: useInstanceId(store, props.baseId, props.id)
    };
    Object.entries(propMap).forEach(([from, to]) => {
      if (props.hasOwnProperty(from)) {
        Object.assign(props, {
          [to]: props[from]
        });
        delete props[from];
      }
    });
    delete props.baseId;
    return /* @__PURE__ */ _jsx(ProxiedComponent, {
      ...props,
      store
    });
  };
  Component.displayName = displayName;
  return Component;
}
var UnproxiedCompositeGroup = forwardRef(({
  role,
  ...props
}, ref) => {
  const Component = role === "row" ? Current.Row : Current.Group;
  return /* @__PURE__ */ _jsx(Component, {
    ref,
    role,
    ...props
  });
});
var Composite = proxyComposite(Object.assign(Current, {
  displayName: "__unstableComposite"
}), {
  baseId: "id"
});
var CompositeGroup = proxyComposite(Object.assign(UnproxiedCompositeGroup, {
  displayName: "__unstableCompositeGroup"
}));
var CompositeItem = proxyComposite(Object.assign(Current.Item, {
  displayName: "__unstableCompositeItem"
}), {
  focusable: "accessibleWhenDisabled"
});
function useCompositeState(legacyStateOptions = {}) {
  deprecated(`wp.components.__unstableUseCompositeState`, {
    since: "6.7",
    alternative: LEGACY_TO_NEW_DISPLAY_NAME.__unstableUseCompositeState
  });
  const {
    baseId,
    currentId: defaultActiveId,
    orientation,
    rtl = false,
    loop: focusLoop = false,
    wrap: focusWrap = false,
    shift: focusShift = false,
    unstable_virtual: virtualFocus
  } = legacyStateOptions;
  return {
    baseId: useInstanceId(Composite, "composite", baseId),
    store: Ariakit.useCompositeStore({
      defaultActiveId,
      rtl,
      orientation,
      focusLoop,
      focusShift,
      focusWrap,
      virtualFocus
    })
  };
}
export {
  Composite,
  CompositeGroup,
  CompositeItem,
  useCompositeState
};
//# sourceMappingURL=index.mjs.map
