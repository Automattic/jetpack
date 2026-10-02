import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { ToastObject as ToastObjectType } from "../useToastManager.mjs";
import type { TransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { StateAttributesMapping } from "../../internals/getStateAttributesProps.mjs";
export declare const toastRootStateAttributesMapping: StateAttributesMapping<ToastRootState>;
/**
 * Groups all parts of an individual toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastRoot: React.ForwardRefExoticComponent<Omit<ToastRootProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export type ToastRootToastObject<Data extends object = any> = ToastObjectType<Data>;
export interface ToastRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether the toasts in the viewport are expanded.
   */
  expanded: boolean;
  /**
   * Whether the toast was limited because the toast limit was exceeded.
   */
  limited: boolean;
  /**
   * The type of the toast.
   */
  type: string | undefined;
  /**
   * Whether the toast is being swiped.
   */
  swiping: boolean;
  /**
   * The direction the toast is being swiped.
   */
  swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
}
export interface ToastRootProps extends BaseUIComponentProps<'div', ToastRootState> {
  /**
   * The toast to render.
   */
  toast: ToastRootToastObject<any>;
  /**
   * Direction(s) in which the toast can be swiped to dismiss.
   * @default ['down', 'right']
   */
  swipeDirection?: 'up' | 'down' | 'left' | 'right' | ('up' | 'down' | 'left' | 'right')[] | undefined;
}
export declare namespace ToastRoot {
  type ToastObject<Data extends object = any> = ToastRootToastObject<Data>;
  type State = ToastRootState;
  type Props = ToastRootProps;
}