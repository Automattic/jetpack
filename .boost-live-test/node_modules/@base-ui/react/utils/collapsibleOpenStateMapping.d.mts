import type { StateAttributesMapping } from "../internals/getStateAttributesProps.mjs";
export declare const triggerOpenStateMapping: StateAttributesMapping<{
  open: boolean;
}>;
export declare const collapsibleOpenStateMapping: {
  open(value: boolean): {
    "data-open": string;
  } | {
    "data-closed": string;
  };
};