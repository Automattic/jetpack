export { DateRangePopover, DateRangePopoverContent } from './date-range-filter';
export type { DateRange } from './date-range-filter';
/*
 * The custom trigger's label has a second reader: the panel's measuring probe
 * needs the exact string the trigger is showing, since "Custom" and a formatted
 * range differ by enough width to move the label-mode boundary. Exported so both
 * derive it from one implementation instead of two.
 *
 * For the same reason every input to that label is owned by the panel, including
 * the remembered custom range below. Anything the trigger keeps to itself is
 * invisible to the probe, and the two drift apart by exactly the width the
 * measurement is trying to account for.
 */
export { getCustomTriggerLabel, getCustomTriggerState } from './get-custom-trigger-state';
export { getCommittedCustomRange } from './last-custom-range';
export type { RememberedCustomRange } from './last-custom-range';
