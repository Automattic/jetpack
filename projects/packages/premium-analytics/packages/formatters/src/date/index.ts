export { formatDate, type DateFormatName } from './format-date';
export { formatDateRange, formatDateRangeCompact } from './format-date-range';
export { formatDateRangeLong } from './format-date-range-long';
/*
 * Owned by `datetime`, which is where the date arithmetic lives. Re-exported
 * here because the span is what shapes a formatted range, so every caller that
 * needs one already imports this package.
 */
export {
	getDateRangeSpan,
	type DateRangeSpan,
	type DateRangeSpanUnit,
} from '@jetpack-premium-analytics/datetime';
