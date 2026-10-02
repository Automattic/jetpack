import * as React from 'react';
import type { ContextMenuRoot } from "./ContextMenuRoot.js";
export interface ContextMenuRootContext {
  anchor: {
    getBoundingClientRect: () => DOMRect;
  };
  setAnchor: React.Dispatch<React.SetStateAction<ContextMenuRootContext['anchor']>>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  actionsRef: React.RefObject<{
    setOpen: (nextOpen: boolean, eventDetails: ContextMenuRoot.ChangeEventDetails) => void;
  } | null>;
  positionerRef: React.RefObject<HTMLElement | null>;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  initialCursorPointRef: React.RefObject<{
    x: number;
    y: number;
  } | null>;
  rootId: string | undefined;
}
export declare const ContextMenuRootContext: React.Context<ContextMenuRootContext | undefined>;
export declare function useContextMenuRootContext(optional: false): ContextMenuRootContext;
export declare function useContextMenuRootContext(optional?: true): ContextMenuRootContext | undefined;