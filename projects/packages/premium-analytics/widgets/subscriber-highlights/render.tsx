/**
 * External dependencies
 */
import {
	useStatsSubscribersCounts,
	type StatsSubscribersCounts,
} from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
import {
	MetricTileGrid,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { envelope, payment, people, share } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import {
	DEFAULT_SUBSCRIBER_METRICS,
	SUBSCRIBER_METRICS,
	type SubscriberHighlightsAttributes,
	type SubscriberMetricId,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The subscribers/counts endpoint reports current totals and is not
// period-scoped, so the widget ignores the dashboard date range. Report params
// are still accepted at the WidgetRoot boundary (and Storybook may inject them)
// so the host contract holds.
type SubscriberHighlightsRenderAttributes = SubscriberHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type SubscriberHighlightsWidgetProps = WidgetRenderProps< SubscriberHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Render-only config per metric: the tile icon and the counts-payload field the
 * tile displays. Ids and labels are shared with the settings checkboxes via
 * `SUBSCRIBER_METRICS` in `widget.ts`.
 */
const TILE_CONFIG: Record<
	SubscriberMetricId,
	{ icon: typeof people; count: ( data?: StatsSubscribersCounts ) => number }
> = {
	total: { icon: people, count: data => data?.total_subscribers ?? 0 },
	paid: { icon: payment, count: data => data?.paid_subscribers ?? 0 },
	free: { icon: envelope, count: data => data?.email_subscribers ?? 0 },
	social: { icon: share, count: data => data?.social_followers ?? 0 },
};

/**
 * Fetches the subscriber counts through the designated `useStatsSubscribersCounts`
 * Stats hook and renders the totals as a `MetricTileGrid`, with the loading /
 * error / empty states rendered through `<WidgetState>`. The counts module has
 * no comparison period, so each tile shows a bare formatted count. Which tiles
 * appear is controlled by the `metrics` attribute.
 *
 * @param {SubscriberMetricId[]} metrics - Enabled metric tile ids.
 * @return The widget content.
 */
function SubscriberHighlightsReport( {
	metrics = DEFAULT_SUBSCRIBER_METRICS,
}: {
	metrics?: SubscriberMetricId[];
} ) {
	const { data, isLoading, isFetching, isError, refetch } = useStatsSubscribersCounts();
	const enabledMetrics = new Set( metrics );

	// Every counts field is optional in the sanitized payload; a response
	// carrying none of them has nothing meaningful to show.
	const hasCounts = !! data && Object.values( data ).some( value => value !== undefined );

	const tiles = SUBSCRIBER_METRICS.filter( ( { id } ) => enabledMetrics.has( id ) ).map(
		( { id, label } ) => ( {
			key: id,
			label,
			icon: TILE_CONFIG[ id ].icon,
			value: TILE_CONFIG[ id ].count( data ),
		} )
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The query keeps the prior response via `placeholderData`, so a failed
				// refetch leaves the tiles on screen; only surface the error when there
				// is nothing to show.
				isError={ isError && ! hasCounts }
				isEmpty={ ! hasCounts }
				error={ {
					description: __(
						"We couldn't load subscriber highlights. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: customer,
					description: __( 'No subscriber counts available yet.', 'jetpack-premium-analytics' ),
				} }
			>
				{ tiles.length === 0 ? (
					<Text className={ styles.placeholder }>
						{ __( 'Select at least one metric to display.', 'jetpack-premium-analytics' ) }
					</Text>
				) : (
					<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
				) }
			</WidgetState>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme consumed by the
 * inner report. Host attributes are forwarded so any injected report params are
 * preserved even though the counts endpoint is not period-scoped.
 *
 * @param {SubscriberHighlightsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SubscriberHighlights( {
	attributes = {},
}: SubscriberHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SubscriberHighlightsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
