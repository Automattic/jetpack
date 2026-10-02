import * as React from 'react';
import { MenuStore } from "../store/MenuStore.mjs";
export declare const MenuSubmenuRootContext: React.Context<MenuSubmenuRootContext | undefined>;
export interface MenuSubmenuRootContext {
  parentMenu: MenuStore<unknown>;
}
export declare function useMenuSubmenuRootContext(): MenuSubmenuRootContext | undefined;