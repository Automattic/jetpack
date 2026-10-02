// packages/components/src/card/card-media/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { View } from "../../view/index.mjs";
import { useCardMedia } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedCardMedia(props, forwardedRef) {
  const cardMediaProps = useCardMedia(props);
  return /* @__PURE__ */ _jsx(View, {
    ...cardMediaProps,
    ref: forwardedRef
  });
}
var CardMedia = contextConnect(UnconnectedCardMedia, "CardMedia");
var component_default = CardMedia;
export {
  CardMedia,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
