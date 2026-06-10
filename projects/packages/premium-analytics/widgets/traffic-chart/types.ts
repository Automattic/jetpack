/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import type { StatsVisitsUnit } from '@jetpack-premium-analytics/data';

/*
 * Inferred types
 */
type MetricFormat = NonNullable< Parameters< typeof formatMetricValue >[ 1 ] >;

type FormatMetricValueOptions = NonNullable< Parameters< typeof formatMetricValue >[ 2 ] >;

export type DataFormat = {
	type: MetricFormat;
	options?: FormatMetricValueOptions;
};

/**
 * Attributes stored on a widget instance: the stats period and how many
 * periods to chart. Stats are not WC-Analytics report params, so they flow to
 * the inner component via props rather than through `WidgetRootContext`.
 */
export type TrafficChartAttributes = {
	unit?: StatsVisitsUnit;
	quantity?: number;
};
