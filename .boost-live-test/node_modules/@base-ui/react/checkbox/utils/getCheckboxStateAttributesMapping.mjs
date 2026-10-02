import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
import * as CheckboxRootDataAttributes from "../root/CheckboxRootDataAttributes.mjs";
export function getCheckboxStateAttributesMapping(state) {
  return {
    checked(value) {
      if (state.indeterminate) {
        // `data-indeterminate` is already handled by the `indeterminate` prop.
        return {};
      }
      if (value) {
        return {
          [CheckboxRootDataAttributes.checked]: ''
        };
      }
      return {
        [CheckboxRootDataAttributes.unchecked]: ''
      };
    },
    ...fieldValidityMapping
  };
}