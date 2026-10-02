import * as React from 'react';
import { type MenuStore } from "../store/MenuStore.mjs";
import { MenuParent } from "./MenuRoot.mjs";
export interface MenuRootContext<Payload = unknown> {
  store: MenuStore<Payload>;
  parent: MenuParent;
}
export declare const MenuRootContext: React.Context<MenuRootContext<unknown> | undefined>;
export declare function useMenuRootContext(optional?: false): MenuRootContext;
export declare function useMenuRootContext(optional: true): MenuRootContext | undefined;