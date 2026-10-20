import type { ReportParams } from '../reports';
import type { DataFormat, ReportResult } from '@automattic/jetpack-premium-analytics-sdk';

/**
 * Filter on the metrics Store performance offers. A plugin returns the list with its metric in;
 * the widget reads the list again whenever a registrant comes or goes.
 */
export const STORE_PERFORMANCE_METRICS_FILTER = 'jetpack.woocommerceStats.storePerformance.metrics';

/** What a metric's report hook returns, as the widget reads it. */
export type StorePerformanceReport = ReportResult< unknown >;

export type StorePerformanceMetric = {
	/** Keys the tab and names the metric in the widget's `hiddenMetrics` attribute. */
	id: string;
	/** Where the tab goes, lowest first; the widget's own run 10 to 50. Absent, after them. */
	order?: number;
	label: string;
	description: string;
	/** The field read from the report's summary and from each of its rows. */
	field: string;
	dataFormat: DataFormat;
	countLabel?: ( count: number ) => string;
	/** Shown in place of the value when the period has nothing to measure the metric over. */
	noDataLabel?: string;
	/** A React hook: the report the metric reads, under the dashboard's report params. */
	useReport: ( params: ReportParams ) => StorePerformanceReport;
};
