import * as React from 'react';
import type { Middleware } from '@floating-ui/react-dom';
export interface InlineRectCoords {
  /** The x position in viewport coordinates. */
  x: number;
  /** The y position in viewport coordinates. */
  y: number;
  /** The line index under the pointer when coordinates were captured. */
  lineIndex?: number | undefined;
  /** The trigger element whose rects produced these coordinates. */
  element: Element;
}
export declare function getInlineRectTriggerProps(coordsRef: React.RefObject<InlineRectCoords | undefined>, isOpen: boolean): Pick<React.HTMLAttributes<Element>, 'onFocus' | 'onMouseEnter' | 'onMouseMove'>;
export declare function updateInlineRectCoords(coordsRef: React.RefObject<InlineRectCoords | undefined>, element: Element, clientX: number, clientY: number): InlineRectCoords | undefined;
export declare function createInlineMiddleware(coordsRef: React.RefObject<InlineRectCoords | undefined>): Middleware;