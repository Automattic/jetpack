import * as React from 'react';
/**
 * Extracts the `ref` from a React element, handling different React versions.
 */
export declare function getReactElementRef(element: unknown): React.Ref<unknown> | null;