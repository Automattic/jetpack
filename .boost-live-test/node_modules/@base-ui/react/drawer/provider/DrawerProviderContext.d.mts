import * as React from 'react';
export interface DrawerProviderContext {
  setDrawerOpen: (drawer: object, open: boolean) => void;
  removeDrawer: (drawer: object) => void;
  active: boolean;
  visualStateStore: DrawerVisualStateStore;
}
export declare const DrawerProviderContext: React.Context<DrawerProviderContext | undefined>;
export interface DrawerVisualState {
  swipeProgress: number;
  frontmostHeight: number;
}
export interface DrawerVisualStateStore {
  getSnapshot: () => DrawerVisualState;
  subscribe: (listener: () => void) => () => void;
  set: (state: Partial<DrawerVisualState>) => void;
}
export declare function useDrawerProviderContext(): DrawerProviderContext | undefined;