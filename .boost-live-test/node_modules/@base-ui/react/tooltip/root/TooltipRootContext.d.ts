import * as React from 'react';
import { TooltipStore } from "../store/TooltipStore.js";
export type TooltipRootContext<Payload = unknown> = TooltipStore<Payload>;
export declare const TooltipRootContext: React.Context<TooltipRootContext<unknown> | undefined>;
export declare function useTooltipRootContext(optional?: false): TooltipRootContext;
export declare function useTooltipRootContext(optional: true): TooltipRootContext | undefined;