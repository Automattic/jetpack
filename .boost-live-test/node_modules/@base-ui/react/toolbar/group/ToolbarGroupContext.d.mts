import * as React from 'react';
export interface ToolbarGroupContext {
  disabled: boolean;
}
export declare const ToolbarGroupContext: React.Context<ToolbarGroupContext | undefined>;
export declare function useToolbarGroupContext(): ToolbarGroupContext | undefined;