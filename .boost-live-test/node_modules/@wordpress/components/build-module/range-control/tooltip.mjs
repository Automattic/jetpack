// packages/components/src/range-control/tooltip.tsx
import clsx from "clsx";
import { useCallback, useEffect, useState } from "@wordpress/element";
import { Tooltip } from "./styles/range-control-styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function SimpleTooltip(props) {
  const {
    className,
    inputRef,
    tooltipPlacement,
    show = false,
    style = {},
    value = 0,
    renderTooltipContent = (v) => v,
    zIndex = 100,
    ...restProps
  } = props;
  const placement = useTooltipPlacement({
    inputRef,
    tooltipPlacement
  });
  const classes = clsx("components-simple-tooltip", className);
  const styles = {
    ...style,
    zIndex
  };
  return /* @__PURE__ */ _jsx(Tooltip, {
    ...restProps,
    "aria-hidden": "false",
    className: classes,
    placement,
    show,
    role: "tooltip",
    style: styles,
    children: renderTooltipContent(value)
  });
}
function useTooltipPlacement({
  inputRef,
  tooltipPlacement
}) {
  const [placement, setPlacement] = useState();
  const setTooltipPlacement = useCallback(() => {
    if (inputRef && inputRef.current) {
      setPlacement(tooltipPlacement);
    }
  }, [tooltipPlacement, inputRef]);
  useEffect(() => {
    setTooltipPlacement();
  }, [setTooltipPlacement]);
  useEffect(() => {
    window.addEventListener("resize", setTooltipPlacement);
    return () => {
      window.removeEventListener("resize", setTooltipPlacement);
    };
  });
  return placement;
}
export {
  SimpleTooltip as default
};
//# sourceMappingURL=tooltip.mjs.map
