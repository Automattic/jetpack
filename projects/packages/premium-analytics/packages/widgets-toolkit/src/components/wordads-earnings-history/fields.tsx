/**
 * External dependencies
 */
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { Badge, Icon, Popover, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './earnings-status-badge.module.scss';
import type { StatsWordAdsEarningsBreakdown } from '@jetpack-premium-analytics/data';
import type { Field } from '@jetpack-premium-analytics/externals';
import type { ComponentProps } from 'react';

/** A single WordAds earnings-history row (one period). */
export type EarningsHistoryRow = {
	id: string;
	period: string;
	amount: number;
	pageviews: number | undefined;
	status: number | undefined;
};

type EarningsStatusIntent = NonNullable< ComponentProps< typeof Badge >[ 'intent' ] >;

type EarningsStatus = {
	label: string;
	tooltip?: string;
	intent: EarningsStatusIntent;
	/** Why a payment is pending; shown beside the badge, not in it, so the label stays short. */
	detail?: string;
};

/** Automattic-internal status: never shown to site owners, so kept out of the Status filter. */
const A8C_ONLY_STATUS = 2;

/**
 * WordAds payment statuses by code, ported verbatim from the Jetpack Stats WordAds
 * `getStatus` map (wp-calypso client/my-sites/stats/wordads/earnings.jsx).
 *
 * @return The label, optional tooltip, badge intent and pending detail for each known code.
 */
function getEarningsStatuses(): Record< number, EarningsStatus > {
	return {
		// Unpaid is red as in the design; the pending codes wait on the site owner,
		// so they get the warning tint, one word, and the reason beside the badge.
		0: {
			label: __( 'Unpaid', 'jetpack-premium-analytics-pkg' ),
			tooltip: __(
				'Payment is on hold until the end of the current month.',
				'jetpack-premium-analytics-pkg'
			),
			intent: 'high',
		},
		1: {
			label: __( 'Paid', 'jetpack-premium-analytics-pkg' ),
			tooltip: __( 'Payment has been processed through PayPal.', 'jetpack-premium-analytics-pkg' ),
			intent: 'stable',
		},
		[ A8C_ONLY_STATUS ]: {
			label: __( 'a8c-only', 'jetpack-premium-analytics-pkg' ),
			intent: 'draft',
		},
		3: {
			label: __( 'Pending', 'jetpack-premium-analytics-pkg' ),
			detail: __( 'Missing tax info', 'jetpack-premium-analytics-pkg' ),
			tooltip: __(
				'Payment is pending due to missing information. You can provide tax information in the settings screen.',
				'jetpack-premium-analytics-pkg'
			),
			intent: 'medium',
		},
		4: {
			label: __( 'Pending', 'jetpack-premium-analytics-pkg' ),
			detail: __( 'Invalid PayPal', 'jetpack-premium-analytics-pkg' ),
			tooltip: __(
				'Payment processing has failed due to invalid PayPal address. You can correct the PayPal address in the settings screen.',
				'jetpack-premium-analytics-pkg'
			),
			intent: 'medium',
		},
	};
}

/**
 * Map a WordAds payment status code to its label, tooltip and badge intent.
 *
 * An unknown or absent status falls through to `?` rather than a label that
 * would assert something about the payment we were never told.
 *
 * @param status - The numeric status from the earnings payload, if any.
 * @return The label, optional tooltip and badge intent.
 */
export function getEarningsStatus( status: number | undefined ): EarningsStatus {
	const statuses = getEarningsStatuses();

	return status !== undefined && Object.hasOwn( statuses, status )
		? statuses[ status ]
		: { label: '?', intent: 'none' };
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
 * Numeric sort that keeps rows without a count last in either direction.
 *
 * @param a         - One field value.
 * @param b         - The other field value.
 * @param direction - The sort direction.
 * @return The comparator result.
 */
function compareOptionalCounts( a: unknown, b: unknown, direction: 'asc' | 'desc' ): number {
	const aCount = typeof a === 'number' ? a : undefined;
	const bCount = typeof b === 'number' ? b : undefined;

	if ( aCount === undefined || bCount === undefined ) {
		return ( aCount === undefined ? 1 : 0 ) - ( bCount === undefined ? 1 : 0 );
	}

	return direction === 'asc' ? aCount - bCount : bCount - aCount;
}

/**
 * A payment status as a badge. A pending status puts its reason in an info icon
 * beside the badge; any other status keeps its explanation on the badge itself.
 *
 * @param props        - The component props.
 * @param props.status - The numeric status from the earnings payload, if any.
 * @return The rendered badge.
 */
export function EarningsStatusBadge( { status }: { status: number | undefined } ) {
	const { label, tooltip, intent, detail } = getEarningsStatus( status );

	if ( detail ) {
		// The same click-open tip as the widget header's info icon.
		return (
			<span className={ styles.root }>
				<Popover.Root modal="trap-focus">
					<Popover.Trigger aria-label={ detail } className={ styles.info }>
						<Icon icon={ info } size={ 16 } />
					</Popover.Trigger>
					<Popover.Popup className={ styles.popup }>
						<Popover.Arrow />
						<VisuallyHidden render={ <Popover.Title /> }>{ detail }</VisuallyHidden>
						<Popover.Description>
							<span className={ styles.reason }>{ detail }</span>
							{ tooltip }
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
				<Badge intent={ intent }>{ label }</Badge>
			</span>
		);
	}

	const badge = (
		<Badge intent={ intent } tabIndex={ tooltip ? 0 : undefined }>
			{ label }
		</Badge>
	);

	return (
		<span className={ styles.root }>
			{ tooltip ? <Tooltip text={ tooltip }>{ badge }</Tooltip> : badge }
		</span>
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
			// The default sort would call `localeCompare` on a missing count and throw.
			// DataViews hands `sort` the field values, not the items, despite its types.
			sort: ( a, b, direction ) => compareOptionalCounts( a, b, direction ),
			render: ( { item } ) => (
				<>{ item.pageviews === undefined ? '—' : formatMetricValue( item.pageviews, 'number' ) }</>
			),
		},
		{
			id: 'status',
			label: __( 'Status', 'jetpack-premium-analytics-pkg' ),
			// A filter rather than search: a substring match for "Paid" also finds "Unpaid".
			// Sorts and filters by the visible label rather than the numeric code.
			getValue: ( { item } ) => getEarningsStatus( item.status ).label,
			// Both pending codes share a label, so one "Pending" option covers them.
			elements: Object.entries( getEarningsStatuses() )
				.filter( ( [ code ] ) => Number( code ) !== A8C_ONLY_STATUS )
				.map( ( [ , { label } ] ) => ( { value: label, label } ) )
				.filter(
					( option, index, all ) => all.findIndex( o => o.value === option.value ) === index
				),
			filterBy: { operators: [ 'is' ] },
			render: ( { item } ) => <EarningsStatusBadge status={ item.status } />,
		},
	];
}
