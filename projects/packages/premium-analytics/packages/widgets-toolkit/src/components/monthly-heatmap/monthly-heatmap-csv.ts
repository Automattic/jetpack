/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { monthlyHeatmapColumnLabels } from './monthly-heatmap-labels';
import type { MonthlyHeatmapRow } from './monthly-heatmap';
import type { CsvColumn } from '../../helpers/build-csv';

/**
 * A monthly views table as CSV rows: one per year, newest first, with the table's columns.
 *
 * @param rows - The table's rows, in any order.
 * @return The rows and their columns.
 */
export function monthlyHeatmapToCsv( rows: MonthlyHeatmapRow[] ): {
	rows: MonthlyHeatmapRow[];
	columns: CsvColumn< MonthlyHeatmapRow >[];
} {
	const labels = monthlyHeatmapColumnLabels();

	return {
		rows: [ ...rows ].sort( ( a, b ) => b.year - a.year ),
		columns: [
			{ label: __( 'Year', 'jetpack-premium-analytics-pkg' ), getValue: row => row.year },
			...labels.months.map( ( label, month ) => ( {
				label,
				getValue: ( row: MonthlyHeatmapRow ) => row.months[ month ] ?? null,
			} ) ),
			{ label: labels.total, getValue: row => row.total },
		],
	};
}
