import * as React from 'react';
import { type MenuRoot } from "../menu/root/MenuRoot.js";
export interface MenubarContext {
  modal: boolean;
  disabled: boolean;
  contentElement: HTMLElement | null;
  setContentElement: (element: HTMLElement | null) => void;
  hasSubmenuOpen: boolean;
  setHasSubmenuOpen: (open: boolean) => void;
  orientation: MenuRoot.Orientation;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  rootId: string | undefined;
}
export declare const MenubarContext: React.Context<MenubarContext | null>;
export declare function useMenubarContext(optional?: false): MenubarContext;
export declare function useMenubarContext(optional: true): MenubarContext | null;