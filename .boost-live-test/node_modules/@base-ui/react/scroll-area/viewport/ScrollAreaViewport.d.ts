import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { ScrollAreaRootState } from "../root/ScrollAreaRoot.js";
/**
 * The actual scrollable container of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export declare const ScrollAreaViewport: React.ForwardRefExoticComponent<Omit<ScrollAreaViewportProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ScrollAreaViewportProps extends BaseUIComponentProps<'div', ScrollAreaViewportState> {}
export interface ScrollAreaViewportState extends ScrollAreaRootState {}
export declare namespace ScrollAreaViewport {
  type Props = ScrollAreaViewportProps;
  type State = ScrollAreaViewportState;
}