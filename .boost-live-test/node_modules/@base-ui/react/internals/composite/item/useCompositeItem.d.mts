import * as React from 'react';
import { type UseCompositeListItemParameters } from "../list/useCompositeListItem.mjs";
import { HTMLProps } from "../../types.mjs";
export interface UseCompositeItemParameters<Metadata> extends Pick<UseCompositeListItemParameters<Metadata>, 'metadata'> {}
export declare function useCompositeItem<Metadata>(params?: UseCompositeItemParameters<Metadata>): {
  compositeProps: HTMLProps;
  compositeRef: React.RefCallback<HTMLElement | null>;
  index: number;
};