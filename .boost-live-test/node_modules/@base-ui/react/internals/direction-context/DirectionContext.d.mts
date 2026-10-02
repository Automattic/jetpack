import * as React from 'react';
export type TextDirection = 'ltr' | 'rtl';
export type DirectionContext = {
  direction: TextDirection;
};
export declare const DirectionContext: React.Context<DirectionContext | undefined>;
export declare function useDirection(): TextDirection;