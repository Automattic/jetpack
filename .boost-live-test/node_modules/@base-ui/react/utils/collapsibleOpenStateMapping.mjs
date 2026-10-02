import * as CollapsiblePanelDataAttributes from "../collapsible/panel/CollapsiblePanelDataAttributes.mjs";
import * as CollapsibleTriggerDataAttributes from "../collapsible/trigger/CollapsibleTriggerDataAttributes.mjs";
const PANEL_OPEN_HOOK = {
  [CollapsiblePanelDataAttributes.open]: ''
};
const PANEL_CLOSED_HOOK = {
  [CollapsiblePanelDataAttributes.closed]: ''
};
export const triggerOpenStateMapping = {
  open(value) {
    if (value) {
      return {
        [CollapsibleTriggerDataAttributes.panelOpen]: ''
      };
    }
    return null;
  }
};
export const collapsibleOpenStateMapping = {
  open(value) {
    if (value) {
      return PANEL_OPEN_HOOK;
    }
    return PANEL_CLOSED_HOOK;
  }
};