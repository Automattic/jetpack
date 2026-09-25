/**
 * External dependencies
 */
import {
	useStatsSubscribersCounts,
	useStatsSubscribersDaysAgo,
} from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
import {
	MetricTileGrid,
	MetricTileGridSkeleton,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { envelope, payment, people, scheduled, share } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { SubscriberHighlightsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params arrive from the host but change nothing here: the counts are all-time or fixed days back.
type SubscriberHighlightsRenderAttributes = SubscriberHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type SubscriberHighlightsWidgetProps = WidgetRenderProps< SubscriberHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const DAYS_AGO = [ 30, 60, 90 ] as const;
const MONTH_AGO = [ 30 ] as const;

const DAYS_AGO_LABELS: Record< ( typeof DAYS_AGO )[ number ], string > = {
	30: __( '30 days ago', 'jetpack-premium-analytics-pkg' ),
	60: __( '60 days ago', 'jetpack-premium-analytics-pkg' ),
	90: __( '90 days ago', 'jetpack-premium-analytics-pkg' ),
};

const ALL_TIME_LABEL = __( 'All-time subscribers', 'jetpack-premium-analytics-pkg' );

const DAYS_AGO_NOTES: Record< ( typeof DAYS_AGO )[ number ], string > = {
	30: __(
		'Total subscribers 30 days ago, excluding social media subscribers',
		'jetpack-premium-analytics-pkg'
	),
	60: __(
		'Total subscribers 60 days ago, excluding social media subscribers',
		'jetpack-premium-analytics-pkg'
	),
	90: __(
		'Total subscribers 90 days ago, excluding social media subscribers',
		'jetpack-premium-analytics-pkg'
	),
};

type Tile = {
	key: string;
	label: string;
	icon: typeof people;
	value: number | null;
	previousValue?: number | null;
	note?: string;
};

function freeCount( total?: number, paid?: number ) {
	return total !== undefined && paid !== undefined ? Math.max( 0, total - paid ) : undefined;
}

// The 30-day bucket is the same count as `subscribers/counts`, stored when it last changed, so it compares like with like.
function valueMonthAgo( current?: number, monthAgo?: number ) {
	if ( current === undefined || monthAgo === undefined ) {
		return null;
	}
	// MetricDelta has no percentage from zero and would show its placeholder instead.
	if ( monthAgo === 0 && current !== 0 ) {
		return null;
	}
	return monthAgo;
}

function SubscriberHighlightsReport() {
	const counts = useStatsSubscribersCounts();

	const total = counts.data?.total_subscribers;
	const paid = counts.data?.paid_subscribers;
	const social = counts.data?.social_followers;

	// Without counts the card can't tell which tiles a site should see, so it shows the error rather than guessing.
	const countsFailed = counts.isError && total === undefined;
	const hasPaidSubscribers = ( paid ?? 0 ) > 0;
	const countsReady = ! counts.isLoading && ! countsFailed;
	const showsHistory = countsReady && ! hasPaidSubscribers;
	const showsChange = countsReady && hasPaidSubscribers;
	const past = useStatsSubscribersDaysAgo( DAYS_AGO, { enabled: showsHistory } );
	const monthAgo = useStatsSubscribersDaysAgo( MONTH_AGO, { enabled: showsChange } );

	const free = freeCount( total, paid );
	const totalMonthAgo = valueMonthAgo( total, monthAgo.counts[ 0 ] );
	const paidMonthAgo = valueMonthAgo( paid, monthAgo.paidCounts[ 0 ] );
	const freeMonthAgo = valueMonthAgo(
		free,
		freeCount( monthAgo.counts[ 0 ], monthAgo.paidCounts[ 0 ] )
	);

	const breakdownTiles: Tile[] = [
		{
			key: 'paid',
			label: __( 'Paid subscribers', 'jetpack-premium-analytics-pkg' ),
			icon: payment,
			value: paid ?? null,
			previousValue: paidMonthAgo,
			note:
				paidMonthAgo !== null
					? __(
							'Paid WordPress.com subscribers. The change is since 30 days ago.',
							'jetpack-premium-analytics-pkg'
						)
					: __( 'Paid WordPress.com subscribers', 'jetpack-premium-analytics-pkg' ),
		},
		{
			key: 'free',
			label: __( 'Free subscribers', 'jetpack-premium-analytics-pkg' ),
			icon: envelope,
			value: free ?? null,
			previousValue: freeMonthAgo,
			note:
				freeMonthAgo !== null
					? __(
							'Email subscribers and free WordPress.com subscribers. The change is since 30 days ago.',
							'jetpack-premium-analytics-pkg'
						)
					: __(
							'Email subscribers and free WordPress.com subscribers',
							'jetpack-premium-analytics-pkg'
						),
		},
	];

	const socialTiles: Tile[] =
		( social ?? 0 ) > 0
			? [
					{
						key: 'social',
						label: __( 'Social followers', 'jetpack-premium-analytics-pkg' ),
						icon: share,
						value: social ?? null,
						previousValue: hasPaidSubscribers ? null : undefined,
						note: sprintf(
							/* translators: %s is the label of the All-time subscribers tile. */
							__( 'Social media subscribers, not included in %s', 'jetpack-premium-analytics-pkg' ),
							ALL_TIME_LABEL
						),
					},
				]
			: [];

	const historyTiles: Tile[] = DAYS_AGO.map( ( days, index ) => ( {
		key: `${ days }-days-ago`,
		label: DAYS_AGO_LABELS[ days ],
		icon: scheduled,
		value: past.counts[ index ] ?? null,
		note: DAYS_AGO_NOTES[ days ],
	} ) );

	const tiles: Tile[] = [
		{
			key: 'total',
			label: ALL_TIME_LABEL,
			icon: people,
			value: total ?? null,
			previousValue: hasPaidSubscribers ? totalMonthAgo : undefined,
			note:
				hasPaidSubscribers && totalMonthAgo !== null
					? __(
							'Total subscribers excluding social media subscribers. The change is since 30 days ago.',
							'jetpack-premium-analytics-pkg'
						)
					: __(
							'Total subscribers excluding social media subscribers',
							'jetpack-premium-analytics-pkg'
						),
		},
		...( hasPaidSubscribers ? breakdownTiles : historyTiles ),
		...socialTiles,
	];

	const hasCounts = tiles.some( tile => tile.value !== null );
	// Scoped to the history: the All-time tile is in `tiles` whenever counts load, so `hasCounts` can never report the history as missing.
	const hasHistory = past.counts.some( count => count !== undefined );
	const isLoading = counts.isLoading || ( showsHistory && past.isLoading );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ counts.isFetching || past.isFetching || monthAgo.isFetching }
				// `placeholderData` keeps the last counts on screen, so a transient refetch failure should not replace them with an error.
				isError={ countsFailed || ( showsHistory && past.isError && ! hasHistory ) }
				isEmpty={ ! hasCounts }
				error={ {
					description: __(
						"We couldn't load subscriber highlights. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [
						{
							label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
							onClick: () => {
								counts.refetch();
								// `refetch()` ignores `enabled`, so only the active series is asked again.
								if ( showsHistory ) {
									past.refetch();
								}
								if ( showsChange ) {
									monthAgo.refetch();
								}
							},
						},
					],
				} }
				empty={ {
					icon: customer,
					description: __( 'No subscriber counts available yet.', 'jetpack-premium-analytics-pkg' ),
				} }
				renderLoading={ <MetricTileGridSkeleton tiles={ tiles.length } /> }
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
			</WidgetState>
		</div>
	);
}

export default function SubscriberHighlights( {
	attributes = {},
}: SubscriberHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SubscriberHighlightsReport />
		</WidgetRoot>
	);
}
