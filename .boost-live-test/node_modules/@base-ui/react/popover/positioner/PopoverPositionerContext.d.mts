import * as React from 'react';
import type { Side, Align } from "../../internals/useAnchorPositioning.mjs";
import type { FloatingContext } from "../../floating-ui-react/index.mjs";
export interface PopoverPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
  context: FloatingContext;
}
export declare const PopoverPositionerContext: React.Context<PopoverPositionerContext | undefined>;
export declare function usePopoverPositionerContext(): PopoverPositionerContext;