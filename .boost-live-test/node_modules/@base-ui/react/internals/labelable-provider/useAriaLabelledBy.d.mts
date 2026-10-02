import * as React from 'react';
export declare function useAriaLabelledBy(explicitAriaLabelledBy: string | undefined, labelId: string | undefined, labelSourceRef: React.RefObject<LabelSource | null>, enableFallback?: boolean, labelSourceId?: string): string | undefined;
type LabelSource = HTMLElement & {
  labels?: NodeListOf<HTMLLabelElement> | null | undefined;
};
export {};