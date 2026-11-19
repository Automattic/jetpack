/**
 * Internal dependencies
 */
import { formatCsvDate, type CsvColumn } from './build-csv';
import type { MetricTab } from '../components/metric-tabs-chart/metric-tabs-chart';

export type MetricTabsCsvRow = {
	date: string;
	values: Record< string, number | null >;
};

export type MetricTabsCsvOptions = {
	/**
	 * The zone the bucket dates are written in.
	 */
	zone: string;

	/**
	 * Whether the buckets are shorter than a day, so each date carries its time.
	 */
	withTime: boolean;

	dateLabel: string;
};

/**
 * A metric chart's current period as CSV rows: one per bucket, one column per metric with a series.
 *
 * @param tabs    - The chart's metrics.
 * @param options - How the dates are written.
 * @return The rows and their columns.
 */
export function metricTabsToCsv(
	tabs: MetricTab[],
	options: MetricTabsCsvOptions
): { rows: MetricTabsCsvRow[]; columns: CsvColumn< MetricTabsCsvRow >[] } {
	const { zone, withTime, dateLabel } = options;
	const exported = tabs.filter( tab => ! tab.unavailable && ! tab.seriesUnavailable );
	const valuesByTime = exported.map(
		tab =>
			new Map(
				tab.current.map( point => [ point.date.getTime(), point.missing ? null : point.value ] )
			)
	);

	const rows = ( exported[ 0 ]?.current ?? [] ).map( point => ( {
		date: formatCsvDate( point.date, zone, withTime ),
		values: Object.fromEntries(
			exported.map( ( tab, index ) => [
				tab.key,
				valuesByTime[ index ].get( point.date.getTime() ) ?? null,
			] )
		),
	} ) );

	const columns: CsvColumn< MetricTabsCsvRow >[] = [
		{ label: dateLabel, getValue: row => row.date },
		...exported.map( tab => ( { label: tab.label, getValue: row => row.values[ tab.key ] } ) ),
	];

	return { rows, columns };
}
