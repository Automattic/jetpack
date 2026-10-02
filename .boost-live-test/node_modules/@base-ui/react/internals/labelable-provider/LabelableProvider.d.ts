import * as React from 'react';
export declare const LabelableProvider: React.FC<LabelableProvider.Props>;
export interface LabelableProviderState {}
export interface LabelableProviderProps {
  children?: React.ReactNode;
}
export declare namespace LabelableProvider {
  type State = LabelableProviderState;
  type Props = LabelableProviderProps;
}