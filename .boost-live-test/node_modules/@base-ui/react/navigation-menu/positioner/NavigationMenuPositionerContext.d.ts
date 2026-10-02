import * as React from 'react';
import { useAnchorPositioning } from "../../internals/useAnchorPositioning.js";
export type NavigationMenuPositionerContext = ReturnType<typeof useAnchorPositioning>;
export declare const NavigationMenuPositionerContext: React.Context<import("../../internals/useAnchorPositioning.js").UseAnchorPositioningReturnValue | undefined>;
export declare function useNavigationMenuPositionerContext(optional: true): NavigationMenuPositionerContext | undefined;
export declare function useNavigationMenuPositionerContext(optional?: false): NavigationMenuPositionerContext;