import * as React from 'react';
export interface NumberFieldScrubAreaContext {
  isScrubbing: boolean;
  isTouchInput: boolean;
  isPointerLockDenied: boolean;
  scrubAreaCursorRef: React.RefObject<HTMLSpanElement | null>;
}
export declare const NumberFieldScrubAreaContext: React.Context<NumberFieldScrubAreaContext | undefined>;
export declare function useNumberFieldScrubAreaContext(): NumberFieldScrubAreaContext;