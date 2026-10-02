import * as React from 'react';
import { type UseRenderElementComponentProps } from "../../internals/useRenderElement.mjs";
import type { BaseUIComponentProps } from "../../internals/types.mjs";
type FocusManagerState = null | {
  modal: boolean;
  open: boolean;
  onOpenChange(open: boolean, data?: {
    reason?: string | undefined;
    event?: Event | undefined;
  }): void;
  domReference: Element | null;
  closeOnFocusOut: boolean;
};
export declare const usePortalContext: () => {
  portalNode: HTMLElement | null;
  setFocusManagerState: React.Dispatch<React.SetStateAction<FocusManagerState>>;
  beforeInsideRef: React.RefObject<HTMLSpanElement | null>;
  afterInsideRef: React.RefObject<HTMLSpanElement | null>;
  beforeOutsideRef: React.RefObject<HTMLSpanElement | null>;
  afterOutsideRef: React.RefObject<HTMLSpanElement | null>;
} | null;
export interface UseFloatingPortalNodeProps {
  ref?: React.Ref<HTMLDivElement> | undefined;
  container?: HTMLElement | ShadowRoot | null | React.RefObject<HTMLElement | ShadowRoot | null> | undefined;
  componentProps?: UseRenderElementComponentProps<any> | undefined;
  elementProps?: React.HTMLAttributes<HTMLDivElement> | undefined;
}
export interface UseFloatingPortalNodeResult {
  node: HTMLElement | null;
  /**
   * The `id` attribute of the portal node. On React 17 it is `undefined` until the `useId`
   * polyfill assigns it in an effect after the node has been created.
   */
  nodeId: string | undefined;
  subtree: React.ReactPortal | null;
}
export declare function useFloatingPortalNode(props?: UseFloatingPortalNodeProps): UseFloatingPortalNodeResult;
export interface FloatingPortalState {}
export declare namespace FloatingPortal {
  type State = FloatingPortalState;
  interface Props<TState> extends BaseUIComponentProps<'div', TState> {
    /**
     * A parent element to render the portal element into.
     */
    container?: UseFloatingPortalNodeProps['container'] | undefined;
    /**
     * @ignore
     * The role for the hidden `aria-owns` owner element.
     */
    portalOwnerRole?: React.AriaRole | undefined;
  }
}
export {};