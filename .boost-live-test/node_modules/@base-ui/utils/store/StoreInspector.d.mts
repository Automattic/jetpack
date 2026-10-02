import * as React from 'react';
import { Store } from "./Store.mjs";
/**
 * Minimal shape of a store owner (such as a Base UI popup handle) that exposes a live store to
 * inspect. Typed structurally so this dev utility stays decoupled from the component packages'
 * handle types. The exposed store is loosely typed on purpose: handles narrow it for their public
 * API, but at runtime it is a full `Store`, which the inspector casts to internally.
 */
export interface StoreOwner {
  readonly store: object;
  subscribeStore?(listener: () => void): () => void;
}
interface StoreInspectorBaseProps {
  /**
   * Additional data to display in the inspector.
   */
  additionalData?: any;
  /**
   * Title to display in the panel header.
   */
  title?: string | undefined;
  /**
   * Whether the inspector panel should be open by default.
   * @default false
   */
  defaultOpen?: boolean | undefined;
}
export type StoreInspectorProps = StoreInspectorBaseProps & ({
  /**
   * Instance of the store to inspect.
   */
  store: Store<any>;
  handle?: undefined;
} | {
  /**
   * A store owner (such as a Base UI popup handle) whose live `store` is inspected.
   */
  handle: StoreOwner;
  store?: undefined;
});
/**
 * A tool to inspect the state of a Store in a floating panel.
 * This is intended for development and debugging purposes.
 */
export declare function StoreInspector(props: StoreInspectorProps): React.JSX.Element;
interface PanelProps {
  anchorElement: HTMLElement | null;
  store: Store<any>;
  title?: string | undefined;
  additionalData?: any;
  open: boolean;
  onClose?: (() => void) | undefined;
}
export declare function StoreInspectorPanel({
  anchorElement,
  store,
  title,
  additionalData,
  open,
  onClose
}: PanelProps): React.ReactPortal | null;
export {};