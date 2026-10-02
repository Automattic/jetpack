import * as React from 'react';
import { type MenuStore } from "../store/MenuStore.js";
import { MenuParent } from "./MenuRoot.js";
export interface MenuRootContext<Payload = unknown> {
  store: MenuStore<Payload>;
  parent: MenuParent;
}
export declare const MenuRootContext: React.Context<MenuRootContext<unknown> | undefined>;
export declare function useMenuRootContext(optional?: false): MenuRootContext;
export declare function useMenuRootContext(optional: true): MenuRootContext | undefined;