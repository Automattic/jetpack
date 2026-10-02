import * as React from 'react';
import { type BaseUIComponentProps } from "../../internals/types.js";
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxPortal: React.ForwardRefExoticComponent<Omit<ComboboxPortalProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ComboboxPortalState {}
export interface ComboboxPortalProps extends BaseUIComponentProps<'div', ComboboxPortalState> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * A parent element to render the portal element into.
   */
  container?: HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null | undefined;
}
export declare namespace ComboboxPortal {
  type State = ComboboxPortalState;
  type Props = ComboboxPortalProps;
}