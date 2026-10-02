import * as React from 'react';
import type { UseCollapsibleRootReturnValue } from "./useCollapsibleRoot.js";
import type { CollapsibleRoot, CollapsibleRootState } from "./CollapsibleRoot.js";
export interface CollapsibleRootContext extends UseCollapsibleRootReturnValue {
  onOpenChange: (open: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => void;
  state: CollapsibleRootState;
}
export declare const CollapsibleRootContext: React.Context<CollapsibleRootContext | undefined>;
export declare function useCollapsibleRootContext(): CollapsibleRootContext;