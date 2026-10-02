import * as React from 'react';
export interface ScrollAreaViewportContext {
  computeThumbPosition: () => void;
}
export declare const ScrollAreaViewportContext: React.Context<ScrollAreaViewportContext | undefined>;
export declare function useScrollAreaViewportContext(): ScrollAreaViewportContext;