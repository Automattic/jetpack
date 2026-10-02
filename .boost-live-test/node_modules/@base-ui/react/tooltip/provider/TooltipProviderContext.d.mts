import * as React from 'react';
/**
 * Holds the provider's `delay` value. `closeDelay` is handled by the delay group.
 */
export declare const TooltipProviderContext: React.Context<number | undefined>;
export declare function useTooltipProviderContext(): number | undefined;