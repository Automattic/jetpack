/**
 * External dependencies
 */
import { formatMonth } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { MONTHS_IN_YEAR } from '../../helpers/month-key';

/**
 * The column headers the table and its CSV share: the months, January first, then the totals.
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
