export { DateRangePopover, DateRangePopoverContent } from './date-range-filter';
export type { DateRange } from './date-range-filter';
/*
 * The custom trigger's label has a second reader: the panel's measuring probe
 * needs the exact string the trigger is showing, since "Custom" and a formatted
 * range differ by enough width to move the label-mode boundary. Exported so both
 * derive it from one implementation, and taking only props so neither side can
 * feed it state the other cannot see.
 */
export { getCustomTriggerLabel, getCustomTriggerState } from './get-custom-trigger-state';
