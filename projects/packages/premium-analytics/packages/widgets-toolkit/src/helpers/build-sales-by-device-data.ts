/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { formatLegendLabels } from './format-legend-labels';
import type { SeriesData } from '@automattic/charts';
import type { ReportDataMap, ReportParams } from '@jetpack-premium-analytics/data';

/**
 * Internal dependencies
 */

export interface SalesByDeviceData {
	chartData: SeriesData[];
}

/**
 * Builds bar chart data for the Sales by Device widget.
 *
 * Shows sales breakdown by device type (Desktop, Mobile, Tablet).
 *
 * @param orderAttribution - Primary period order attribution data
 * @param hasComparison    - Whether comparison period should be included
 * @param reportParams     - Report parameters for generating date range labels
 */
export function buildSalesByDeviceData(
	orderAttribution: ReportDataMap[ 'order-attribution' ] | undefined,
	hasComparison: boolean,
	reportParams: ReportParams
): SalesByDeviceData {
	if ( ! orderAttribution?.data || orderAttribution.data.length === 0 ) {
		return {
			chartData: [],
		};
	}

	const { primary: primaryLabel, comparison: comparisonLabel } = formatLegendLabels( reportParams );

	const { data } = orderAttribution;

	// Build bar chart data - current period
	const chartData: SeriesData[] = [
		{
			label: primaryLabel,
			data: data.map( item => ( {
				label: item.item || __( 'Unassigned', 'jetpack-premium-analytics' ),
				value: item.current_period?.value ?? 0,
			} ) ),
		},
	];

	// Add comparison period if available
	if ( hasComparison ) {
		chartData.push( {
			label: comparisonLabel,
			data: data.map( item => ( {
				label: item.item || __( 'Unassigned', 'jetpack-premium-analytics' ),
				value: item.previous_period?.value ?? 0,
			} ) ),
		} );
	}

	return {
		chartData,
	};
}
