import { useRenderElement } from "../internals/useRenderElement.mjs";
/**
 * Renders a Base UI element.
 *
 * @public
 */
export function useRender(params) {
  return useRenderElement(params.defaultTagName ?? 'div', params, params);
}