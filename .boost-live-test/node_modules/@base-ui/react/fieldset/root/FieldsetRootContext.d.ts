import * as React from 'react';
export interface FieldsetRootContext {
  legendId: string | undefined;
  setLegendId: React.Dispatch<React.SetStateAction<string | undefined>>;
  disabled: boolean;
}
export declare const FieldsetRootContext: React.Context<FieldsetRootContext | undefined>;
export declare function useFieldsetRootContext(optional: true): FieldsetRootContext | undefined;
export declare function useFieldsetRootContext(optional?: false): FieldsetRootContext;