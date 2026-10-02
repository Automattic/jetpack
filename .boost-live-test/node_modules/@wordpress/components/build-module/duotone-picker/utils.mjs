// packages/components/src/duotone-picker/utils.ts
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
extend([namesPlugin]);
function getDefaultColors(palette) {
  if (!palette || palette.length < 2) {
    return ["#000", "#fff"];
  }
  return palette.map(({
    color
  }) => ({
    color,
    brightness: colord(color).brightness()
  })).reduce(([min, max], current) => {
    return [current.brightness <= min.brightness ? current : min, current.brightness >= max.brightness ? current : max];
  }, [{
    brightness: 1,
    color: ""
  }, {
    brightness: 0,
    color: ""
  }]).map(({
    color
  }) => color);
}
function getGradientFromCSSColors(colors = [], angle = "90deg") {
  const l = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${i * l}%, ${c} ${(i + 1) * l}%`).join(", ");
  return `linear-gradient( ${angle}, ${stops} )`;
}
function getColorStopsFromColors(colors) {
  return colors.map((color, i) => ({
    position: i * 100 / (colors.length - 1),
    color
  }));
}
function getColorsFromColorStops(colorStops = []) {
  return colorStops.map(({
    color
  }) => color);
}
export {
  getColorStopsFromColors,
  getColorsFromColorStops,
  getDefaultColors,
  getGradientFromCSSColors
};
//# sourceMappingURL=utils.mjs.map
