import * as React from 'react';
export interface MenuRadioItemContext {
  checked: boolean;
  highlighted: boolean;
  disabled: boolean;
}
export declare const MenuRadioItemContext: React.Context<MenuRadioItemContext | undefined>;
export declare function useMenuRadioItemContext(): MenuRadioItemContext;