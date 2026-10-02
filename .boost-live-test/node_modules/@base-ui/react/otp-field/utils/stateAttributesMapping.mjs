import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
export const rootStateAttributesMapping = {
  value: () => null,
  length: () => null,
  ...fieldValidityMapping
};
export const inputStateAttributesMapping = {
  value: () => null,
  index: () => null,
  ...fieldValidityMapping
};