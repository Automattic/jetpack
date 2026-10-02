import { Dimensions } from "../floating-ui-react/types.mjs";
import { Side } from "../internals/useAnchorPositioning.mjs";
/**
 * Allows the element to automatically resize based on its content while supporting animations.
 */
export declare function usePopupAutoResize(parameters: UsePopupAutoResizeParameters): void;
interface UsePopupAutoResizeParameters {
  /**
   * Element to resize.
   */
  popupElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  /**
   * Whether the popup is mounted.
   */
  mounted: boolean;
  content: unknown;
  /**
   * Callback fired immediately before measuring the dimensions of the new content.
   */
  onMeasureLayout?: (() => void) | undefined;
  /**
   * Callback fired after the new dimensions have been measured.
   *
   * @param previousDimensions Dimensions before the change, or `null` if this is the first measurement.
   * @param newDimensions Newly measured dimensions.
   */
  onMeasureLayoutComplete?: ((previousDimensions: Dimensions | null, newDimensions: Dimensions) => void) | undefined;
  side: Side;
  direction: 'ltr' | 'rtl';
}
export {};