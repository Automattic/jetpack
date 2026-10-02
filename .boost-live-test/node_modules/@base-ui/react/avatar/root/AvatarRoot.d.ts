import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Displays a user's profile picture, initials, or fallback icon.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export declare const AvatarRoot: React.ForwardRefExoticComponent<Omit<AvatarRootProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';
export interface AvatarRootState {
  /**
   * The image loading status.
   */
  imageLoadingStatus: ImageLoadingStatus;
}
export interface AvatarRootProps extends BaseUIComponentProps<'span', AvatarRootState> {}
export declare namespace AvatarRoot {
  type State = AvatarRootState;
  type Props = AvatarRootProps;
}