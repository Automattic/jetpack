import * as React from 'react';
export interface DrawerVirtualKeyboardContext {
  onTouchStart: (event: React.TouchEvent<Element>) => void;
  onTouchMove: (event: TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent<Element>) => void;
  onTouchCancel: () => void;
}
export declare const DrawerVirtualKeyboardContext: React.Context<DrawerVirtualKeyboardContext | undefined>;
export declare function useDrawerVirtualKeyboardContext(): DrawerVirtualKeyboardContext | undefined;