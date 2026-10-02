import * as React from 'react';
import { HTMLProps } from "../../internals/types.js";
import { MenuStore } from "../store/MenuStore.js";
import type { UseMenuItemMetadata } from "./useMenuItem.js";
export interface UseMenuItemCommonPropsParameters {
  /**
   * Whether to close the menu when the item is clicked.
   */
  closeOnClick: boolean;
  /**
   * Determines if the menu item is highlighted.
   */
  highlighted: boolean;
  /**
   * The id of the menu item.
   */
  id: string | undefined;
  /**
   * The node id of the menu positioner.
   */
  nodeId: string | undefined;
  /**
   * The menu store.
   */
  store: MenuStore<any>;
  /**
   * Whether a typeahead session is in progress.
   */
  typingRef?: React.RefObject<boolean> | undefined;
  /**
   * Ref to the item element.
   */
  itemRef: React.RefObject<HTMLElement | null>;
  /**
   * Metadata for checking item type before triggering click.
   */
  itemMetadata: UseMenuItemMetadata;
}
/**
 * Returns common props shared by all menu item types.
 * This hook extracts the shared logic for id, role, tabIndex, onKeyDown,
 * onMouseMove, onClick, and onMouseUp handlers.
 */
export declare function useMenuItemCommonProps(params: UseMenuItemCommonPropsParameters): HTMLProps;
export interface UseMenuItemCommonPropsState {}