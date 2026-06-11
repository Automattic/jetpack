/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/data';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type {
	ComparativeLineChartSeries,
	ComparativeDatePointDate,
} from '../components/chart-comparative-line/types';

/**
 * Generic type for time series data that has date_start and metric values
 */
export type TimeSeriesData = {
	date_start: string;
	[ key: string ]: string | number;
};

/**
 * Generic type for time series response.
 * The summary only needs date_start and date_end for chart labels,
 * so we use a loose constraint that accepts any summary with those fields.
 */
type TimeSeriesResponse< T extends TimeSeriesData > = {
	data: T[];
	summary: { date_start: string; date_end: string };
};

/**
 * Map time series items array into chart series data.
 */
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
};

/**
 * Generic function to build line chart series from time series data
 */
export function buildTimeSeriesChartData< T extends TimeSeriesData >( {
	primary,
	comparison,
	metricKey,
	emptyDataFallback = 'empty-array',
}: BuildTimeSeriesChartOptions< T > ): ComparativeLineChartSeries[] {
	if ( ! primary.data?.length ) {
		if ( emptyDataFallback === 'no-data-series' ) {
			return [
				{
					label: __( 'No data available', 'jetpack-premium-analytics' ),
					data: [],
				},
			];
		}
		return [];
	}

	const primarySeries: ComparativeLineChartSeries = {
		label: formatDateRange( {
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
		label: formatDateRange( {
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
