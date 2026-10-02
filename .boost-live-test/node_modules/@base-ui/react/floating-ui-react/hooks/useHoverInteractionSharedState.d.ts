import { Timeout } from '@base-ui/utils/useTimeout';
import type { FloatingRootContext, SafePolygonOptions } from "../types.js";
import { isInteractiveElement } from "../utils.js";
export { isInteractiveElement };
export declare class HoverInteraction {
  pointerType: string | undefined;
  interactedInside: boolean;
  handler: ((event: MouseEvent) => void) | undefined;
  blockMouseMove: boolean;
  performedPointerEventsMutation: boolean;
  pointerEventsScopeElement: HTMLElement | SVGSVGElement | null;
  pointerEventsReferenceElement: HTMLElement | SVGSVGElement | null;
  pointerEventsFloatingElement: HTMLElement | null;
  restTimeoutPending: boolean;
  openChangeTimeout: Timeout;
  restTimeout: Timeout;
  handleCloseOptions: SafePolygonOptions | undefined;
  constructor();
  static create(): HoverInteraction;
  dispose: () => void;
  disposeEffect: () => () => void;
}
type PointerEventsMutationState = Pick<HoverInteraction, 'performedPointerEventsMutation' | 'pointerEventsScopeElement' | 'pointerEventsReferenceElement' | 'pointerEventsFloatingElement'>;
export declare function clearSafePolygonPointerEventsMutation(instance: PointerEventsMutationState): void;
export declare function applySafePolygonPointerEventsMutation(instance: PointerEventsMutationState, options: {
  scopeElement: HTMLElement | SVGSVGElement;
  referenceElement: HTMLElement | SVGSVGElement;
  floatingElement: HTMLElement;
}): void;
export declare function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction;