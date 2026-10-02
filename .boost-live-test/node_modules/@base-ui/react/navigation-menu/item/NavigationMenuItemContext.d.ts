import * as React from 'react';
export interface NavigationMenuItemContextValue {
  value: any;
}
export declare const NavigationMenuItemContext: React.Context<NavigationMenuItemContextValue | undefined>;
export declare function useNavigationMenuItemContext(): NavigationMenuItemContextValue;