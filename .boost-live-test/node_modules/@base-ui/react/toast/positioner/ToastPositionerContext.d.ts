import * as React from 'react';
import type { UseAnchorPositioningReturnValue } from "../../internals/useAnchorPositioning.js";
export type ToastPositionerContext = Pick<UseAnchorPositioningReturnValue, 'side' | 'align' | 'arrowRef' | 'arrowUncentered' | 'arrowStyles'>;
export declare const ToastPositionerContext: React.Context<ToastPositionerContext | undefined>;
export declare function useToastPositionerContext(): ToastPositionerContext;