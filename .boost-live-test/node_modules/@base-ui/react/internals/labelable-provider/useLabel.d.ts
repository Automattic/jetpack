import * as React from 'react';
export declare function useLabel(params?: UseLabelParameters): UseLabelReturnValue;
export interface UseLabelParameters {
  id?: string | undefined;
  /**
   * Control id used when no labelable context control id exists.
   */
  fallbackControlId?: string | undefined;
  /**
   * Whether the rendered element is a native `<label>`.
   * @default false
   */
  native?: boolean | undefined;
  /**
   * Additional callback to sync the current label id with local component state/store.
   */
  setLabelId?: React.Dispatch<React.SetStateAction<string | undefined>> | undefined;
  /**
   * Custom focus handler for non-native labels.
   * If omitted, focus behavior targets the resolved control id.
   */
  focusControl?: ((event: React.MouseEvent, controlId: string | undefined) => void) | undefined;
}
export type UseLabelReturnValue = React.HTMLAttributes<any> & React.LabelHTMLAttributes<any>;
export declare function focusElementWithVisible(element: HTMLElement): void;