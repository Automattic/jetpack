import * as React from 'react';
export interface TabsListContext {
  activateOnFocus: boolean;
  registerIndicatorUpdateListener: (listener: () => void) => () => void;
  registerTabResizeObserverElement: (element: HTMLElement) => () => void;
  tabsListElement: HTMLElement | null;
}
export declare const TabsListContext: React.Context<TabsListContext | undefined>;
export declare function useTabsListContext(): TabsListContext;