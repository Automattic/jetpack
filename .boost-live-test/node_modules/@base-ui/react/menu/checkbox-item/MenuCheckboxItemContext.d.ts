import * as React from 'react';
export interface MenuCheckboxItemContext {
  checked: boolean;
  highlighted: boolean;
  disabled: boolean;
}
export declare const MenuCheckboxItemContext: React.Context<MenuCheckboxItemContext | undefined>;
export declare function useMenuCheckboxItemContext(): MenuCheckboxItemContext;