// packages/components/src/color-picker/legacy-adapter.tsx
import ColorPicker from "./component.mjs";
import { useDeprecatedProps } from "./use-deprecated-props.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var LegacyAdapter = (props) => {
  return /* @__PURE__ */ _jsx(ColorPicker, {
    ...useDeprecatedProps(props)
  });
};
export {
  LegacyAdapter
};
//# sourceMappingURL=legacy-adapter.mjs.map
