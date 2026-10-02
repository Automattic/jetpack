import * as React from 'react';
import { type TextDirection } from "../internals/direction-context/DirectionContext.js";
/**
 * Enables RTL behavior for Base UI components.
 *
 * Documentation: [Base UI Direction Provider](https://base-ui.com/react/utils/direction-provider)
 */
export declare const DirectionProvider: React.FC<DirectionProvider.Props>;
export interface DirectionProviderState {}
export interface DirectionProviderProps {
  children?: React.ReactNode;
  /**
   * The reading direction of the text
   * @default 'ltr'
   */
  direction?: TextDirection | undefined;
}
export declare namespace DirectionProvider {
  type State = DirectionProviderState;
  type Props = DirectionProviderProps;
}