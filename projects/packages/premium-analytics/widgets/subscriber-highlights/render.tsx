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
import { __ } from '@wordpress/i18n';
import { calendar, people } from '@wordpress/icons';
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

function SubscriberHighlightsReport() {
	const total = useStatsSubscribersCounts();
	const past = useStatsSubscribersDaysAgo( DAYS_AGO );

	const tiles = [
		{
			key: 'total',
			label: __( 'Total subscribers', 'jetpack-premium-analytics-pkg' ),
			icon: people,
			value: total.data?.total_subscribers ?? null,
		},
		...DAYS_AGO.map( ( days, index ) => ( {
			key: `${ days }-days-ago`,
			label: DAYS_AGO_LABELS[ days ],
			icon: calendar,
			value: past.counts[ index ] ?? null,
		} ) ),
	];

	const hasCounts = tiles.some( tile => tile.value !== null );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ total.isLoading || past.isLoading }
				isFetching={ total.isFetching || past.isFetching }
				// `placeholderData` keeps the last counts on screen, so a transient refetch failure should not replace them with an error.
				isError={ ( total.isError || past.isError ) && ! hasCounts }
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
								total.refetch();
								past.refetch();
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
