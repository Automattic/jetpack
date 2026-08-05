// Chart composition utilities
export { attachSubComponents } from './create-composition';

// Date parsing utilities
export { parseAsLocalDate } from './date-parsing';

// Number and metric formatting utilities
export { formatMetricValue } from './format-metric-value';
export type { MetricValueType } from './format-metric-value';
export { formatPercentage } from './format-percentage';

// Chart measurement utilities
export { getLongestTickWidth } from './get-longest-tick-width';

// Style and theming utilities
export {
	getSeriesBarStyles,
	getSeriesLineStyles,
	getSeriesStroke,
	getItemShapeStyles,
} from './get-styles';

// Browser detection utilities
export { isSafari } from './is-safari';

// Theme merging utilities
export { mergeThemes } from './merge-themes';

// Color utilities
export * from './color-utils';

// CSS utilities
export { resolveCssVariable } from './resolve-css-var';

// Font sizing utilities
export { resolveFontSize } from './resolve-font-size';
