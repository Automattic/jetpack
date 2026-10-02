import * as React from 'react';
import type { MenuRoot } from "../root/MenuRoot.js";
export interface MenuRadioGroupContext {
  value: any;
  setValue: (newValue: any, eventDetails: MenuRoot.ChangeEventDetails) => void;
  disabled: boolean;
}
export declare const MenuRadioGroupContext: React.Context<MenuRadioGroupContext | undefined>;
export declare function useMenuRadioGroupContext(): MenuRadioGroupContext;