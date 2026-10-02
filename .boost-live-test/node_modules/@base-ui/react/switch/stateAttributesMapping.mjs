import { fieldValidityMapping } from "../internals/field-constants/constants.mjs";
import * as SwitchRootDataAttributes from "./root/SwitchRootDataAttributes.mjs";
export const stateAttributesMapping = {
  ...fieldValidityMapping,
  checked(value) {
    if (value) {
      return {
        [SwitchRootDataAttributes.checked]: ''
      };
    }
    return {
      [SwitchRootDataAttributes.unchecked]: ''
    };
  }
};