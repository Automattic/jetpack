// `resolveFieldTypes` is a bridge for Storybook until widget-primitives 0.8.0, where a
// record without a module resolves its own `attributes` inside `useWidgetTypes`
// (WordPress/gutenberg#82485). Move the story helper onto that and stop exporting it.
export { registerFieldTypes, resolveFieldTypes } from './field-types';

export {
	CHART_INTERVAL_ELEMENTS,
	chartIntervalField,
	type ChartIntervalFieldAttributes,
} from './chart-interval-field/chart-interval-field';
export {
	defaultReportParamsForGrain,
	reportParamsAttributeField,
	type ReportGrain,
	type ReportParamsFieldAttributes,
} from './report-params-field/report-params-field';
