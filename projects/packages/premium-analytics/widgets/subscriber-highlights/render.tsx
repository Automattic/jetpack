/**
 * External dependencies
 */
import {
	useStatsMembershipProducts,
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
import { __ } from '@wordpress/i18n';
import { envelope, payment, people, scheduled } from '@wordpress/icons';
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

const DAYS_AGO_LABELS: Record< ( typeof DAYS_AGO )[ number ], string > = {
	30: __( '30 days ago', 'jetpack-premium-analytics-pkg' ),
	60: __( '60 days ago', 'jetpack-premium-analytics-pkg' ),
	90: __( '90 days ago', 'jetpack-premium-analytics-pkg' ),
};

type Tile = {
	key: string;
	label: string;
	icon: typeof people;
	value: number | null;
	note?: string;
};

function SubscriberHighlightsReport() {
	const products = useStatsMembershipProducts();
	const counts = useStatsSubscribersCounts();

	// A failed products request falls back to the history tiles rather than blocking the widget.
	const hasPaidProducts = ( products.data?.productCount ?? 0 ) > 0;
	const showsHistory = ! products.isLoading && ! hasPaidProducts;
	const past = useStatsSubscribersDaysAgo( DAYS_AGO, { enabled: showsHistory } );

	const total = counts.data?.total_subscribers;
	const paid = counts.data?.paid_subscribers;

	const breakdownTiles: Tile[] = [
		{
			key: 'paid',
			label: __( 'Paid subscribers', 'jetpack-premium-analytics-pkg' ),
			icon: payment,
			value: paid ?? null,
			note: __( 'Paid WordPress.com subscribers', 'jetpack-premium-analytics-pkg' ),
		},
		{
			key: 'free',
			label: __( 'Free subscribers', 'jetpack-premium-analytics-pkg' ),
			icon: envelope,
			value: total !== undefined && paid !== undefined ? total - paid : null,
			note: __(
				'Email subscribers and free WordPress.com subscribers',
				'jetpack-premium-analytics-pkg'
			),
		},
	];

	const historyTiles: Tile[] = DAYS_AGO.map( ( days, index ) => ( {
		key: `${ days }-days-ago`,
		label: DAYS_AGO_LABELS[ days ],
		icon: scheduled,
		value: past.counts[ index ] ?? null,
	} ) );

	const tiles: Tile[] = [
		{
			key: 'total',
			label: __( 'All-time subscribers', 'jetpack-premium-analytics-pkg' ),
			icon: people,
			value: total ?? null,
			note: __(
				'Total subscribers excluding social media subscribers',
				'jetpack-premium-analytics-pkg'
			),
		},
		...( hasPaidProducts ? breakdownTiles : historyTiles ),
	];

	const hasCounts = tiles.some( tile => tile.value !== null );
	const isLoading = products.isLoading || counts.isLoading || ( showsHistory && past.isLoading );
	const isError = counts.isError || ( showsHistory && past.isError );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ products.isFetching || counts.isFetching || past.isFetching }
				// `placeholderData` keeps the last counts on screen, so a transient refetch failure should not replace them with an error.
				isError={ isError && ! hasCounts }
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
								products.refetch();
								counts.refetch();
								if ( showsHistory ) {
									past.refetch();
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
