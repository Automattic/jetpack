/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { StatsWordAdsEarningsBreakdown } from '@jetpack-premium-analytics/data';
import type { Field, View } from '@wordpress/dataviews';

/** A single WordAds earnings-history row (one period). */
export type EarningsHistoryRow = {
	id: string;
	period: string;
	amount: number;
	pageviews: number;
	status: number;
};

/**
 * Map a WordAds payment status code to its label and tooltip, ported verbatim
 * from the Jetpack Stats WordAds `getStatus` map
 * (wp-calypso client/my-sites/stats/wordads/earnings.jsx).
 *
 * @param status - The numeric status from the earnings payload.
 * @return The label and optional tooltip.
 */
export function getEarningsStatus( status: number ): { label: string; tooltip?: string } {
	switch ( status ) {
		case 0:
			return {
				label: __( 'Unpaid', 'jetpack-premium-analytics' ),
				tooltip: __(
					'Payment is on hold until the end of the current month.',
					'jetpack-premium-analytics'
				),
			};
		case 1:
			return {
				label: __( 'Paid', 'jetpack-premium-analytics' ),
				tooltip: __( 'Payment has been processed through PayPal.', 'jetpack-premium-analytics' ),
			};
		case 2:
			return { label: __( 'a8c-only', 'jetpack-premium-analytics' ) };
		case 3:
			return {
				label: __( 'Pending (Missing Tax Info)', 'jetpack-premium-analytics' ),
				tooltip: __(
					'Payment is pending due to missing information. You can provide tax information in the settings screen.',
					'jetpack-premium-analytics'
				),
			};
		case 4:
			return {
				label: __( 'Pending (Invalid PayPal)', 'jetpack-premium-analytics' ),
				tooltip: __(
					'Payment processing has failed due to invalid PayPal address. You can correct the PayPal address in the settings screen.',
					'jetpack-premium-analytics'
				),
			};
		default:
			return { label: '?' };
	}
}

/**
 * Flatten a period-keyed earnings breakdown into table rows, newest period
 * first (period keys are `YYYY-MM`, so a descending string sort is chronological).
 *
 * @param breakdown - The normalized breakdown map, or undefined.
 * @return The rows for the table.
 */
export function flattenEarningsBreakdown(
	breakdown: StatsWordAdsEarningsBreakdown | undefined
): EarningsHistoryRow[] {
	if ( ! breakdown ) {
		return [];
	}

	return Object.entries( breakdown )
		.map( ( [ period, row ] ) => ( {
			id: period,
			period,
			amount: row.amount,
			pageviews: row.pageviews,
			status: row.status,
		} ) )
		.sort( ( a, b ) => b.period.localeCompare( a.period ) );
}

/**
 * Display the `YYYY-MM` period key as `MM-YYYY`, matching the upstream table.
 *
 * @param period - The period key.
 * @return The display label.
 */
function formatPeriodLabel( period: string ): string {
	const [ year, month ] = period.split( '-' );
	return month && year ? `${ month }-${ year }` : period;
}

/**
 * DataViews field config for the earnings-history table. Built as a getter (not
 * a module constant) so labels translate after the i18n locale data loads,
 * mirroring `routes/reports/posts/config/fields.tsx`.
 *
 * @return The field config.
 */
export function getWordAdsHistoryFields(): Field< EarningsHistoryRow >[] {
	return [
		{
			id: 'period',
			label: __( 'Period', 'jetpack-premium-analytics' ),
			enableHiding: false,
			getValue: ( { item } ) => item.period,
			render: ( { item } ) => <>{ formatPeriodLabel( item.period ) }</>,
		},
		{
			id: 'amount',
			label: __( 'Earnings', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.amount,
			render: ( { item } ) => (
				<>{ formatMetricValue( item.amount, 'currency', { decimals: 2 } ) }</>
			),
		},
		{
			id: 'pageviews',
			label: __( 'Ads Served', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.pageviews,
			render: ( { item } ) => <>{ formatMetricValue( item.pageviews, 'number' ) }</>,
		},
		{
			id: 'status',
			label: __( 'Status', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => getEarningsStatus( item.status ).label,
			render: ( { item } ) => {
				const { label, tooltip } = getEarningsStatus( item.status );

				return tooltip ? (
					<Tooltip text={ tooltip }>
						<span tabIndex={ 0 }>{ label }</span>
					</Tooltip>
				) : (
					<span>{ label }</span>
				);
			},
		},
	];
}

/** Default view: newest period first, with responsive equal-width columns. */
export const EARNINGS_HISTORY_VIEW: Partial< View > = {
	sort: { field: 'period', direction: 'desc' },
	layout: {
		density: 'compact',
		styles: {
			period: { width: '25%' },
			amount: { align: 'end', width: '25%' },
			pageviews: { align: 'end', width: '25%' },
			status: { width: '25%' },
		},
	},
};
