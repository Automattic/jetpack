// packages/components/src/custom-gradient-picker/utils.ts
import gradientParser from "gradient-parser";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import { DEFAULT_GRADIENT, HORIZONTAL_GRADIENT_ORIENTATION, DIRECTIONAL_ORIENTATION_ANGLE_MAP } from "./constants.mjs";
import { serializeGradient } from "./serializer.mjs";
extend([namesPlugin]);
function getLinearGradientRepresentation(gradientAST) {
  return serializeGradient({
    type: "linear-gradient",
    orientation: HORIZONTAL_GRADIENT_ORIENTATION,
    colorStops: gradientAST.colorStops
  });
}
function hasUnsupportedLength(item) {
  return item.length === void 0 || item.length.type !== "%";
}
function getGradientAstWithDefault(value) {
  let gradientAST;
  let hasGradient = !!value;
  const valueToParse = value ?? DEFAULT_GRADIENT;
  try {
    gradientAST = gradientParser.parse(valueToParse)[0];
  } catch (error) {
    console.warn("wp.components.CustomGradientPicker failed to parse the gradient with error", error);
    gradientAST = gradientParser.parse(DEFAULT_GRADIENT)[0];
    hasGradient = false;
  }
  if (!Array.isArray(gradientAST.orientation) && gradientAST.orientation?.type === "directional") {
    gradientAST.orientation = {
      type: "angular",
      value: DIRECTIONAL_ORIENTATION_ANGLE_MAP[gradientAST.orientation.value].toString()
    };
  }
  if (gradientAST.colorStops.some(hasUnsupportedLength)) {
    const {
      colorStops
    } = gradientAST;
    const step = 100 / (colorStops.length - 1);
    colorStops.forEach((stop, index) => {
      stop.length = {
        value: `${step * index}`,
        type: "%"
      };
    });
  }
  return {
    gradientAST,
    hasGradient
  };
}
function getGradientAstWithControlPoints(gradientAST, newControlPoints) {
  return {
    ...gradientAST,
    colorStops: newControlPoints.map(({
      position,
      color
    }) => {
      const {
        r,
        g,
        b,
        a
      } = colord(color).toRgb();
      return {
        length: {
          type: "%",
          value: position?.toString()
        },
        type: a < 1 ? "rgba" : "rgb",
        value: a < 1 ? [`${r}`, `${g}`, `${b}`, `${a}`] : [`${r}`, `${g}`, `${b}`]
      };
    })
  };
}
function getStopCssColor(colorStop) {
  switch (colorStop.type) {
    case "hex":
      return `#${colorStop.value}`;
    case "literal":
      return colorStop.value;
    case "var":
      return `${colorStop.type}(${colorStop.value})`;
    case "rgb":
    case "rgba":
      return `${colorStop.type}(${colorStop.value.join(",")})`;
    case "hsl": {
      const [hue, saturation, lightness] = colorStop.value;
      return `hsl(${hue},${saturation}%,${lightness}%)`;
    }
    case "hsla": {
      const [hue, saturation, lightness, alpha] = colorStop.value;
      return `hsla(${hue},${saturation}%,${lightness}%,${alpha})`;
    }
    default:
      return "transparent";
  }
}
export {
  getGradientAstWithControlPoints,
  getGradientAstWithDefault,
  getLinearGradientRepresentation,
  getStopCssColor
};
//# sourceMappingURL=utils.mjs.map
