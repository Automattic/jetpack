import type { ExtendedElements, FloatingTreeType, Placement } from "../types.mjs";
export { isTargetInsideEnabledTrigger as isInsideEnabledTrigger } from "../utils/element.mjs";
export interface HandleCloseOptions {
  blockPointerEvents?: boolean | undefined;
  getScope?: (() => HTMLElement | SVGSVGElement | null) | undefined;
}
export interface HandleCloseContext {
  x: number | null;
  y: number | null;
  placement: Placement | null;
  elements: Pick<ExtendedElements, 'domReference' | 'floating'>;
  onClose: () => void;
  nodeId?: string | undefined;
  tree?: FloatingTreeType | null | undefined;
  leave?: boolean | undefined;
}
export type HandleCloseContextBase = Omit<HandleCloseContext, 'onClose' | 'tree' | 'x' | 'y'>;
export interface HandleClose {
  (context: HandleCloseContext): (event: MouseEvent) => void;
  __options?: HandleCloseOptions | undefined;
}
type HoverDelay = number | Partial<{
  open: number;
  close: number;
}>;
export declare function getDelay(value: HoverDelay | (() => HoverDelay) | undefined, prop: 'open' | 'close', pointerType?: PointerEvent['pointerType']): number | undefined;
export declare function getRestMs(value: number | (() => number)): number;
export declare function isClickLikeOpenEvent(openEventType: string | undefined, interactedInside: boolean): boolean;
export declare function isHoverOpenEvent(openEventType: string | undefined): boolean | undefined;