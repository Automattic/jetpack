/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/data';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { formatComparisonSeriesLabel } from './format-comparison-series-label';
import type {
	ComparativeLineChartSeries,
	ComparativeDatePointDate,
} from '../components/chart-comparative-line/types';

export type TimeSeriesData = {
	date_start: string;
	[ key: string ]: string | number;
};

/**
 * The summary is only read for chart labels, so it stays loosely constrained to
 * `date_start` / `date_end`.
 */
type TimeSeriesResponse< T extends TimeSeriesData > = {
	data: T[];
	summary: { date_start: string; date_end: string };
};

function mapTimeSeriesToLineChartData< T extends TimeSeriesData >(
	data: T[],
	metricKey: keyof T
): ComparativeDatePointDate[] {
	if ( ! data ) {
		return [];
	}

	return data.map( item => ( {
		date: localTZDate( item.date_start ),
		value: Number( item[ metricKey ] ),
	} ) );
}

type BuildTimeSeriesChartOptions< T extends TimeSeriesData > = {
	primary: TimeSeriesResponse< T >;
	comparison?: TimeSeriesResponse< T >;
	metricKey: keyof T;
	emptyDataFallback?: 'empty-array' | 'no-data-series';
	/**
	 * Name both periods after the metric instead of after their date ranges.
	 * Omit it and each series is labelled with its own range.
	 */
	label?: string;
};

/**
 * Build a chart's current- and previous-period series from a time-series
 * response, reading one metric out of each point. Both series share a `group`
 * and collapse into one legend item; pass `label` to name it after the metric.
 *
 * @param options                   - The build options.
 * @param options.primary           - The current-period response.
 * @param options.comparison        - The previous-period response, when comparison is enabled.
 * @param options.metricKey         - The metric field to read from each point.
 * @param options.emptyDataFallback - What to return when the primary response has no points.
 * @param options.label             - Metric name for both series' labels; omit for date ranges.
 * @return The chart series, current period first.
 */
export function buildTimeSeriesChartData< T extends TimeSeriesData >( {
	primary,
	comparison,
	metricKey,
	emptyDataFallback = 'empty-array',
	label,
}: BuildTimeSeriesChartOptions< T > ): ComparativeLineChartSeries[] {
	if ( ! primary.data?.length ) {
		if ( emptyDataFallback === 'no-data-series' ) {
			return [
				{
					label: __( 'No data available', 'jetpack-premium-analytics-pkg' ),
					data: [],
				},
			];
		}
		return [];
	}

	const primarySeries: ComparativeLineChartSeries = {
		label:
			label ||
			formatDateRange( {
				from: localTZDate( primary.summary.date_start ),
				to: localTZDate( primary.summary.date_end ),
			} ),
		data: mapTimeSeriesToLineChartData( primary.data, metricKey ),
		group: 'primary',
		options: {},
	};

	if ( ! comparison?.data?.length ) {
		return [ primarySeries ];
	}

	const comparisonSeries: ComparativeLineChartSeries = {
		label: label
			? formatComparisonSeriesLabel( label )
			: formatDateRange( {
					from: localTZDate( comparison.summary.date_start ),
					to: localTZDate( comparison.summary.date_end ),
			  } ),
		data: mapTimeSeriesToLineChartData( comparison.data, metricKey ),
		group: 'primary',
		options: {
			type: 'comparison',
		},
	};

	return [ primarySeries, comparisonSeries ];
}
