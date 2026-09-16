/**
 * External dependencies
 */
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { StatsWordAdsEarningsBreakdown } from '@jetpack-premium-analytics/data';
import type { Field, View } from '@jetpack-premium-analytics/externals';

/** A single WordAds earnings-history row (one period). */
export type EarningsHistoryRow = {
	id: string;
	period: string;
	amount: number;
	pageviews: number;
	status: number | undefined;
};

/**
 * Map a WordAds payment status code to its label and tooltip, ported verbatim
 * from the Jetpack Stats WordAds `getStatus` map
 * (wp-calypso client/my-sites/stats/wordads/earnings.jsx).
 *
 * An unknown or absent status falls through to `?` rather than a label that
 * would assert something about the payment we were never told.
 *
 * @param status - The numeric status from the earnings payload, if any.
 * @return The label and optional tooltip.
 */
export function getEarningsStatus( status: number | undefined ): {
	label: string;
	tooltip?: string;
} {
	switch ( status ) {
		case 0:
			return {
				label: __( 'Unpaid', 'jetpack-premium-analytics-pkg' ),
				tooltip: __(
					'Payment is on hold until the end of the current month.',
					'jetpack-premium-analytics-pkg'
				),
			};
		case 1:
			return {
				label: __( 'Paid', 'jetpack-premium-analytics-pkg' ),
				tooltip: __(
					'Payment has been processed through PayPal.',
					'jetpack-premium-analytics-pkg'
				),
			};
		case 2:
			return { label: __( 'a8c-only', 'jetpack-premium-analytics-pkg' ) };
		case 3:
			return {
				label: __( 'Pending (Missing Tax Info)', 'jetpack-premium-analytics-pkg' ),
				tooltip: __(
					'Payment is pending due to missing information. You can provide tax information in the settings screen.',
					'jetpack-premium-analytics-pkg'
				),
			};
		case 4:
			return {
				label: __( 'Pending (Invalid PayPal)', 'jetpack-premium-analytics-pkg' ),
				tooltip: __(
					'Payment processing has failed due to invalid PayPal address. You can correct the PayPal address in the settings screen.',
					'jetpack-premium-analytics-pkg'
				),
			};
		default:
			return { label: '?' };
	}
}

/**
 * Flatten a period-keyed earnings breakdown into table rows. Row order is left
 * to each consumer's own view sort, which the sortable column headers drive.
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

	return Object.entries( breakdown ).map( ( [ period, row ] ) => ( {
		id: period,
		period,
		amount: row.amount,
		pageviews: row.pageviews,
		status: row.status,
	} ) );
}

/**
 * Display the `YYYY-MM` period key in the site's locale, e.g. "August 2026".
 *
 * Anchored to the reporting zone before formatting, so the first of the month
 * cannot roll back into the previous one.
 *
 * @param period - The period key.
 * @return The display label.
 */
export function formatEarningsPeriod( period: string ): string {
	const parsed = parseSiteDateTime( `${ period }-01` );
	return parsed ? formatDate( parsed, 'monthYear' ) : period;
}

/**
 * A payment status label, with its explanation in a tooltip when there is one.
 *
 * @param props        - The component props.
 * @param props.status - The numeric status from the earnings payload, if any.
 * @return The rendered label.
 */
export function EarningsStatusLabel( { status }: { status: number | undefined } ) {
	const { label, tooltip } = getEarningsStatus( status );

	return tooltip ? (
		<Tooltip text={ tooltip }>
			<span tabIndex={ 0 }>{ label }</span>
		</Tooltip>
	) : (
		<span>{ label }</span>
	);
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
			// `getValue` is omitted on the fields below: DataViews defaults to
			// `item[ field.id ]`, and each id already matches its row property.
			id: 'period',
			label: __( 'Period', 'jetpack-premium-analytics-pkg' ),
			enableHiding: false,
			// Searches and sorts the raw `YYYY-MM`, which keeps the order chronological.
			// A query therefore matches a year or `2026-09`, not the "September 2026" on screen.
			enableGlobalSearch: true,
			render: ( { item } ) => <>{ formatEarningsPeriod( item.period ) }</>,
		},
		{
			id: 'amount',
			label: __( 'Earnings', 'jetpack-premium-analytics-pkg' ),
			render: ( { item } ) => <>{ formatMetricValue( item.amount, 'currency' ) }</>,
		},
		{
			id: 'pageviews',
			label: __( 'Ads Served', 'jetpack-premium-analytics-pkg' ),
			render: ( { item } ) => <>{ formatMetricValue( item.pageviews, 'number' ) }</>,
		},
		{
			id: 'status',
			label: __( 'Status', 'jetpack-premium-analytics-pkg' ),
			// A filter rather than search: a substring match for "Paid" also finds "Unpaid".
			// Sorts and filters by the visible label rather than the numeric code.
			getValue: ( { item } ) => getEarningsStatus( item.status ).label,
			elements: [ 0, 1, 2, 3, 4 ].map( code => {
				const { label } = getEarningsStatus( code );
				return { value: label, label };
			} ),
			filterBy: { operators: [ 'is' ] },
			render: ( { item } ) => <EarningsStatusLabel status={ item.status } />,
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
