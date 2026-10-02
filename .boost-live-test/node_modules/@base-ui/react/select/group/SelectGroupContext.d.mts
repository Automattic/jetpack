import * as React from 'react';
export interface SelectGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
}
export declare const SelectGroupContext: React.Context<SelectGroupContext | undefined>;
export declare function useSelectGroupContext(): SelectGroupContext;