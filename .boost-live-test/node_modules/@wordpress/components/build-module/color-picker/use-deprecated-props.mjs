// packages/components/src/color-picker/use-deprecated-props.ts
import { colord } from "colord";
import memoize from "memize";
import { useCallback } from "@wordpress/element";
function isLegacyProps(props) {
  return typeof props.onChangeComplete !== "undefined" || typeof props.disableAlpha !== "undefined" || typeof props.color?.hex === "string";
}
function getColorFromLegacyProps(color) {
  if (color === void 0) {
    return;
  }
  if (typeof color === "string") {
    return color;
  }
  if (color.hex) {
    return color.hex;
  }
  return void 0;
}
var transformColorStringToLegacyColor = memoize((color) => {
  const colordColor = colord(color);
  const hex = colordColor.toHex();
  const rgb = colordColor.toRgb();
  const hsv = colordColor.toHsv();
  const hsl = colordColor.toHsl();
  return {
    hex,
    rgb,
    hsv,
    hsl,
    source: "hex",
    oldHue: hsl.h
  };
});
function useDeprecatedProps(props) {
  const {
    onChangeComplete
  } = props;
  const legacyChangeHandler = useCallback((color) => {
    onChangeComplete(transformColorStringToLegacyColor(color));
  }, [onChangeComplete]);
  if (isLegacyProps(props)) {
    return {
      color: getColorFromLegacyProps(props.color),
      enableAlpha: !props.disableAlpha,
      onChange: legacyChangeHandler
    };
  }
  return {
    ...props,
    color: props.color,
    enableAlpha: props.enableAlpha,
    onChange: props.onChange
  };
}
export {
  useDeprecatedProps
};
//# sourceMappingURL=use-deprecated-props.mjs.map
