export { DateRangePopover, DateRangePopoverContent } from './date-range-filter';
export type { DateRange } from './date-range-filter';
/*
 * The custom trigger's label has a second reader: the panel's measuring probe
 * needs the exact string shown, since "Custom" vs. a formatted range differ
 * enough to move the label-mode boundary. Exported so both share one source.
 */
export { getCustomTriggerLabel, getCustomTriggerState } from './get-custom-trigger-state';
