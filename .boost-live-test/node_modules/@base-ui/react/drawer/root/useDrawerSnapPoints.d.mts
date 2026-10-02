import type { DrawerSnapPoint } from "./DrawerRootContext.mjs";
export interface ResolvedDrawerSnapPoint {
  value: DrawerSnapPoint;
  height: number;
  offset: number;
}
/**
 * Resolves the vertical swipe movement for a snap point, applying square-root damping once the drag
 * overshoots the fully-open edge (`nextOffset < 0`) so the popup resists travelling past it.
 */
export declare function getSnapPointSwipeMovement(baseOffset: number, movementValue: number): number;
/**
 * Returns the index of the value closest to `target`, or `-1` if `values` is empty.
 */
export declare function closestSnapPointIndex(values: number[], target: number): number;
export declare function useDrawerSnapPoints(): {
  snapPoints: DrawerSnapPoint[] | undefined;
  activeSnapPoint: DrawerSnapPoint | null;
  setActiveSnapPoint: (snapPoint: DrawerSnapPoint | null, eventDetails?: import("./DrawerRoot.mjs").DrawerRootSnapPointChangeEventDetails) => void;
  popupHeight: number;
  viewportHeight: number;
  resolvedSnapPoints: ResolvedDrawerSnapPoint[];
  activeSnapPointOffset: number | null;
};