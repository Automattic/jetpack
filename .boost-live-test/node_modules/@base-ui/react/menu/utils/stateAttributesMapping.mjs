import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import * as MenuCheckboxItemDataAttributes from "../checkbox-item/MenuCheckboxItemDataAttributes.mjs";
export const itemMapping = {
  checked(value) {
    if (value) {
      return {
        [MenuCheckboxItemDataAttributes.checked]: ''
      };
    }
    return {
      [MenuCheckboxItemDataAttributes.unchecked]: ''
    };
  },
  ...transitionStatusMapping
};