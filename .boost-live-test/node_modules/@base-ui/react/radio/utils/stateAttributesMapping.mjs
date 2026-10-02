import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
import * as RadioRootDataAttributes from "../root/RadioRootDataAttributes.mjs";
export const stateAttributesMapping = {
  checked(value) {
    if (value) {
      return {
        [RadioRootDataAttributes.checked]: ''
      };
    }
    return {
      [RadioRootDataAttributes.unchecked]: ''
    };
  },
  ...transitionStatusMapping,
  ...fieldValidityMapping
};