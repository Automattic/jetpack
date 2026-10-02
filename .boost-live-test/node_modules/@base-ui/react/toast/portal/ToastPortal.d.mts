import * as React from 'react';
import { type BaseUIComponentProps } from "../../internals/types.mjs";
/**
 * A portal element that moves the viewport to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastPortal: React.ForwardRefExoticComponent<Omit<ToastPortalProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToastPortalState {}
export interface ToastPortalProps extends BaseUIComponentProps<'div', ToastPortalState> {
  /**
   * A parent element to render the portal element into.
   */
  container?: HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null | undefined;
}
export declare namespace ToastPortal {
  type State = ToastPortalState;
  type Props = ToastPortalProps;
}