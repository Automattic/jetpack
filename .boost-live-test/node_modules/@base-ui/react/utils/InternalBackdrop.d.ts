import * as React from 'react';
export interface InternalBackdropState {}
export interface InternalBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The element to cut out of the backdrop.
   * This is useful for allowing certain elements to be interactive while the backdrop is present.
   */
  cutout?: Element | null | undefined;
}
export declare namespace InternalBackdrop {
  type State = InternalBackdropState;
  type Props = InternalBackdropProps;
}