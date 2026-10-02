// packages/components/src/custom-gradient-picker/serializer.ts
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
export {
  serializeGradient,
  serializeGradientColor,
  serializeGradientColorStop,
  serializeGradientOrientation,
  serializeGradientPosition
};
//# sourceMappingURL=serializer.mjs.map
