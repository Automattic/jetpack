import * as React from 'react';
import { type UseCompositeListItemParameters } from "../list/useCompositeListItem.js";
import { HTMLProps } from "../../types.js";
export interface UseCompositeItemParameters<Metadata> extends Pick<UseCompositeListItemParameters<Metadata>, 'metadata'> {}
export declare function useCompositeItem<Metadata>(params?: UseCompositeItemParameters<Metadata>): {
  compositeProps: HTMLProps;
  compositeRef: React.RefCallback<HTMLElement | null>;
  index: number;
};