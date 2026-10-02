import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
const nullMapping = () => null;
export const sliderStateAttributesMapping = {
  activeThumbIndex: nullMapping,
  max: nullMapping,
  min: nullMapping,
  minStepsBetweenValues: nullMapping,
  step: nullMapping,
  values: nullMapping,
  ...fieldValidityMapping
};