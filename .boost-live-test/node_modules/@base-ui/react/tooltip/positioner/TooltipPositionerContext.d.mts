import * as React from 'react';
import type { UseAnchorPositioningReturnValue } from "../../internals/useAnchorPositioning.mjs";
export type TooltipPositionerContext = Pick<UseAnchorPositioningReturnValue, 'side' | 'align' | 'arrowRef' | 'arrowUncentered' | 'arrowStyles'>;
export declare const TooltipPositionerContext: React.Context<TooltipPositionerContext | undefined>;
export declare function useTooltipPositionerContext(): TooltipPositionerContext;