import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.mjs";
import type { AvatarRootState } from "../root/AvatarRoot.mjs";
/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export declare const AvatarFallback: React.ForwardRefExoticComponent<Omit<AvatarFallbackProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface AvatarFallbackState extends AvatarRootState {}
export interface AvatarFallbackProps extends BaseUIComponentProps<'span', AvatarFallbackState> {
  /**
   * How long to wait before showing the fallback. Specified in milliseconds.
   *
   * @default 0
   */
  delay?: number | undefined;
}
export declare namespace AvatarFallback {
  type State = AvatarFallbackState;
  type Props = AvatarFallbackProps;
}