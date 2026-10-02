import * as React from 'react';
import type { FloatingTreeType } from "../types.js";
import { FloatingTreeStore } from "./FloatingTreeStore.js";
/**
 * Returns the parent node id for nested floating elements, if available.
 * Returns `null` for top-level floating elements.
 */
export declare const useFloatingParentNodeId: () => string | null;
/**
 * Returns the nearest floating tree context, if available.
 */
export declare const useFloatingTree: (externalTree?: FloatingTreeStore) => FloatingTreeType | null;
/**
 * Registers a node into the `FloatingTree`, returning its id.
 * @see https://floating-ui.com/docs/FloatingTree
 */
export declare function useFloatingNodeId(externalTree?: FloatingTreeStore): string | undefined;
export interface FloatingNodeProps {
  children?: React.ReactNode;
  id: string | undefined;
}
export interface FloatingTreeProps {
  children?: React.ReactNode;
  externalTree?: FloatingTreeStore | undefined;
}