// packages/components/src/h-stack/hook.tsx
import { hasConnectNamespace, useContextSystem } from "../context/index.mjs";
import { FlexItem, useFlex } from "../flex/index.mjs";
import { getAlignmentProps } from "./utils.mjs";
import { getValidChildren } from "../utils/get-valid-children.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function useHStack(props) {
  const {
    alignment = "edge",
    children,
    direction,
    spacing = 2,
    ...otherProps
  } = useContextSystem(props, "HStack");
  const align = getAlignmentProps(alignment, direction);
  const validChildren = getValidChildren(children);
  const clonedChildren = validChildren.map((child, index) => {
    const _isSpacer = hasConnectNamespace(child, ["Spacer"]);
    if (_isSpacer) {
      const childElement = child;
      const _key = childElement.key || `hstack-${index}`;
      return /* @__PURE__ */ _jsx(FlexItem, {
        isBlock: true,
        ...childElement.props
      }, _key);
    }
    return child;
  });
  const propsForFlex = {
    children: clonedChildren,
    direction,
    justify: "center",
    ...align,
    ...otherProps,
    gap: spacing
  };
  const {
    isColumn,
    ...flexProps
  } = useFlex(propsForFlex);
  return flexProps;
}
export {
  useHStack
};
//# sourceMappingURL=hook.mjs.map
