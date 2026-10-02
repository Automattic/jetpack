import { collapsibleOpenStateMapping as baseMapping } from "../../utils/collapsibleOpenStateMapping.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
export const collapsibleStateAttributesMapping = {
  ...baseMapping,
  ...transitionStatusMapping
};