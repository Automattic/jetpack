/**
 * External dependencies
 */
import { formatMonth } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { MONTHS_IN_YEAR } from '../../helpers/month-key';
import type { MonthlyHeatmapRow } from './monthly-heatmap';
import type { CsvColumn } from '../../helpers/build-csv';

/**
 * The table's column headers: the months, January first, then the totals column.
 *
 * @return The month labels and the totals label.
 */
export function monthlyHeatmapColumnLabels(): { months: string[]; total: string } {
	return {
		months: Array.from( { length: MONTHS_IN_YEAR }, ( _, month ) =>
			formatMonth( month, { short: true } )
		),
		total: __( 'Totals', 'jetpack-premium-analytics-pkg' ),
	};
}

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
