import * as React from 'react';
import type { Orientation } from "../../internals/types.mjs";
export interface ToolbarRootContext {
  disabled: boolean;
  orientation: Orientation;
}
export declare const ToolbarRootContext: React.Context<ToolbarRootContext | undefined>;
export declare function useToolbarRootContext(optional?: false): ToolbarRootContext;
export declare function useToolbarRootContext(optional: true): ToolbarRootContext | undefined;