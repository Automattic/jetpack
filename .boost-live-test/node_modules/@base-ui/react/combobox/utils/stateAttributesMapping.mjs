import { pressableTriggerOpenStateMapping } from "../../utils/popupStateMapping.mjs";
import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
import * as ComboboxInputDataAttributes from "../input/ComboboxInputDataAttributes.mjs";
export const triggerStateAttributesMapping = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
  popupSide: side => side ? {
    [ComboboxInputDataAttributes.popupSide]: side
  } : null,
  listEmpty: empty => empty ? {
    [ComboboxInputDataAttributes.listEmpty]: ''
  } : null
};