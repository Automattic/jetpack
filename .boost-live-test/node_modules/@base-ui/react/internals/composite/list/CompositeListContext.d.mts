import * as React from 'react';
export interface CompositeListRegistration<Metadata> {
  metadata: Metadata | null;
  index: number | null;
  label: string | null | undefined;
  textRef: React.RefObject<HTMLElement | null> | undefined;
}
export interface CompositeListContextValue<Metadata> {
  register: (node: Element, registration: CompositeListRegistration<Metadata>) => void;
  unregister: (node: Element) => void;
  subscribeMapChange: (fn: (map: Map<Element, Metadata>) => void) => () => void;
  nextIndexRef: React.RefObject<number>;
}
export declare const CompositeListContext: React.Context<CompositeListContextValue<any>>;
export declare function useCompositeListContext(): CompositeListContextValue<any>;