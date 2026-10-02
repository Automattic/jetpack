import * as React from 'react';
import type { UseAnchorPositioningReturnValue } from "../../internals/useAnchorPositioning.js";
export type ComboboxPositionerContext = Pick<UseAnchorPositioningReturnValue, 'side' | 'align' | 'arrowRef' | 'arrowUncentered' | 'arrowStyles' | 'anchorHidden' | 'isPositioned'>;
export declare const ComboboxPositionerContext: React.Context<ComboboxPositionerContext | undefined>;
export declare function useComboboxPositionerContext(optional?: false): ComboboxPositionerContext;
export declare function useComboboxPositionerContext(optional: true): ComboboxPositionerContext | undefined;