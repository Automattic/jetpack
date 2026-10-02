import * as React from 'react';
export type ScrollAreaScrollbarContext = 'horizontal' | 'vertical';
export declare const ScrollAreaScrollbarContext: React.Context<ScrollAreaScrollbarContext | undefined>;
export declare function useScrollAreaScrollbarContext(): ScrollAreaScrollbarContext;