// packages/components/src/higher-order/navigate-regions/index.tsx
import { useState, useRef } from "@wordpress/element";
import { createHigherOrderComponent, useRefEffect, useMergeRefs } from "@wordpress/compose";
import { isKeyboardEvent } from "@wordpress/keycodes";
import { jsx as _jsx } from "react/jsx-runtime";
var defaultShortcuts = {
  previous: [{
    modifier: "ctrlShift",
    character: "`"
  }, {
    modifier: "ctrlShift",
    character: "~"
  }, {
    modifier: "access",
    character: "p"
  }],
  next: [{
    modifier: "ctrl",
    character: "`"
  }, {
    modifier: "access",
    character: "n"
  }]
};
function useNavigateRegions(shortcuts = defaultShortcuts) {
  const ref = useRef(null);
  const [isFocusingRegions, setIsFocusingRegions] = useState(false);
  function focusRegion(offset) {
    const regions = Array.from(ref.current?.querySelectorAll('[role="region"][tabindex="-1"]') ?? []);
    if (!regions.length) {
      return;
    }
    let nextRegion = regions[0];
    const wrappingRegion = ref.current?.ownerDocument?.activeElement?.closest('[role="region"][tabindex="-1"]');
    const selectedIndex = wrappingRegion ? regions.indexOf(wrappingRegion) : -1;
    if (selectedIndex !== -1) {
      let nextIndex = selectedIndex + offset;
      nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
      nextIndex = nextIndex === regions.length ? 0 : nextIndex;
      nextRegion = regions[nextIndex];
    }
    nextRegion.focus();
    setIsFocusingRegions(true);
  }
  const clickRef = useRefEffect((element) => {
    function onClick() {
      setIsFocusingRegions(false);
    }
    element.addEventListener("click", onClick);
    return () => {
      element.removeEventListener("click", onClick);
    };
  }, [setIsFocusingRegions]);
  return {
    ref: useMergeRefs([ref, clickRef]),
    className: isFocusingRegions ? "is-focusing-regions" : "",
    onKeyDown(event) {
      if (shortcuts.previous.some(({
        modifier,
        character
      }) => {
        return isKeyboardEvent[modifier](event, character);
      })) {
        focusRegion(-1);
      } else if (shortcuts.next.some(({
        modifier,
        character
      }) => {
        return isKeyboardEvent[modifier](event, character);
      })) {
        focusRegion(1);
      }
    }
  };
}
var navigate_regions_default = createHigherOrderComponent((Component) => function NavigateRegions({
  shortcuts,
  ...props
}) {
  return /* @__PURE__ */ _jsx("div", {
    ...useNavigateRegions(shortcuts),
    children: /* @__PURE__ */ _jsx(Component, {
      ...props
    })
  });
}, "navigateRegions");
export {
  navigate_regions_default as default,
  useNavigateRegions
};
//# sourceMappingURL=index.mjs.map
