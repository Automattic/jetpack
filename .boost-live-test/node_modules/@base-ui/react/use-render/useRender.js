"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRender = useRender;
var _useRenderElement = require("../internals/useRenderElement");
/**
 * Renders a Base UI element.
 *
 * @public
 */
function useRender(params) {
  return (0, _useRenderElement.useRenderElement)(params.defaultTagName ?? 'div', params, params);
}