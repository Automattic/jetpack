import * as React from 'react';
import type { PopoverStore } from "../store/PopoverStore.mjs";
export type PopoverRootContext<Payload = unknown> = PopoverStore<Payload>;
export declare const PopoverRootContext: React.Context<PopoverRootContext<unknown> | undefined>;
export declare function usePopoverRootContext(optional?: false): PopoverRootContext;
export declare function usePopoverRootContext(optional: true): PopoverRootContext | undefined;