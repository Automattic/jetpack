import * as React from 'react';
export interface UseControlledProps<T = unknown> {
  /**
   * Holds the component value when it's controlled.
   */
  controlled: T | undefined;
  /**
   * The default value when uncontrolled, and the fallback if a controlled value later becomes `undefined`.
   */
  default: T | undefined;
  /**
   * The component name displayed in warnings.
   */
  name: string;
  /**
   * The name of the state variable displayed in warnings.
   */
  state?: string | undefined;
}
export declare function useControlled<T = unknown>(props: Omit<UseControlledProps<T>, 'default'> & {
  default: T;
}): [T, React.Dispatch<React.SetStateAction<T>>];
export declare function useControlled<T = unknown>(props: UseControlledProps<T>): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>];