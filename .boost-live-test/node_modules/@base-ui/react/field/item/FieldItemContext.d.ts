import * as React from 'react';
export interface FieldItemContext {
  disabled: boolean;
}
export declare const FieldItemContext: React.Context<FieldItemContext>;
export declare function useFieldItemContext(): FieldItemContext;