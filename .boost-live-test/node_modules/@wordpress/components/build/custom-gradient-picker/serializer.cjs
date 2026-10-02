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

// packages/components/src/custom-gradient-picker/serializer.ts
var serializer_exports = {};
__export(serializer_exports, {
  serializeGradient: () => serializeGradient,
  serializeGradientColor: () => serializeGradientColor,
  serializeGradientColorStop: () => serializeGradientColorStop,
  serializeGradientOrientation: () => serializeGradientOrientation,
  serializeGradientPosition: () => serializeGradientPosition
});
module.exports = __toCommonJS(serializer_exports);
function serializeGradientColor({
  type,
  value
}) {
  if (type === "literal") {
    return value;
  }
  if (type === "hex") {
    return `#${value}`;
  }
  if (type === "var") {
    return `var(${value})`;
  }
  if (type === "hsl") {
    const [hue, saturation, lightness] = value;
    return `hsl(${hue},${saturation}%,${lightness}%)`;
  }
  if (type === "hsla") {
    const [hue, saturation, lightness, alpha] = value;
    return `hsla(${hue},${saturation}%,${lightness}%,${alpha})`;
  }
  return `${type}(${value.join(",")})`;
}
function serializeGradientPosition(position) {
  if (!position) {
    return "";
  }
  const {
    value,
    type
  } = position;
  if (type === "calc") {
    return `calc(${value})`;
  }
  return `${value}${type}`;
}
function serializeGradientColorStop({
  type,
  value,
  length
}) {
  return `${serializeGradientColor({
    type,
    value
  })} ${serializeGradientPosition(length)}`;
}
function serializeGradientOrientation(orientation) {
  if (Array.isArray(orientation) || !orientation || orientation.type !== "angular") {
    return;
  }
  return `${orientation.value}deg`;
}
function serializeGradient({
  type,
  orientation,
  colorStops
}) {
  const serializedOrientation = serializeGradientOrientation(orientation);
  const serializedColorStops = colorStops.sort((colorStop1, colorStop2) => {
    const getNumericStopValue = (colorStop) => {
      return colorStop?.length?.value === void 0 ? 0 : parseInt(colorStop.length.value);
    };
    return getNumericStopValue(colorStop1) - getNumericStopValue(colorStop2);
  }).map(serializeGradientColorStop);
  return `${type}(${[serializedOrientation, ...serializedColorStops].filter(Boolean).join(",")})`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  serializeGradient,
  serializeGradientColor,
  serializeGradientColorStop,
  serializeGradientOrientation,
  serializeGradientPosition
});
//# sourceMappingURL=serializer.cjs.map
