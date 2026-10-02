import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
export const stateAttributesMapping = {
  inputValue: () => null,
  value: () => null,
  ...fieldValidityMapping
};