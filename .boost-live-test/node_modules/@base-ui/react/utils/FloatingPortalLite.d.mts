import * as React from 'react';
import { type BaseUIComponentProps } from "../internals/types.mjs";
type PortalContainer = HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null;
export interface FloatingPortalLiteState {}
export interface FloatingPortalLiteProps<TState> extends BaseUIComponentProps<'div', TState> {
  container?: PortalContainer | undefined;
}
export declare namespace FloatingPortalLite {
  type State = FloatingPortalLiteState;
  type Props<TState> = FloatingPortalLiteProps<TState>;
}
export {};