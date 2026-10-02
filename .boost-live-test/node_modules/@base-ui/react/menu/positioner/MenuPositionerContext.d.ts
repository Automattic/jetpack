import * as React from 'react';
import type { UseAnchorPositioningReturnValue } from "../../internals/useAnchorPositioning.js";
export type MenuPositionerContext = Pick<UseAnchorPositioningReturnValue, 'side' | 'align' | 'arrowRef' | 'arrowUncentered' | 'arrowStyles' | 'context'>;
export declare const MenuPositionerContext: React.Context<MenuPositionerContext | undefined>;
export declare function useMenuPositionerContext(optional?: false): MenuPositionerContext;
export declare function useMenuPositionerContext(optional: true): MenuPositionerContext | undefined;