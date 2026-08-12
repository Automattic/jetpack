/**
 * External dependencies
 */
import {
	useStatsWordAdsEarnings,
	type StatsWordAdsEarningsResponse,
} from '@jetpack-premium-analytics/data';
import { megaphone } from '@jetpack-premium-analytics/icons';
import {
	MetricTileGrid,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { payment, receipt, tip } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import {
	DEFAULT_WORDADS_EARNINGS_METRICS,
	WORDADS_EARNINGS_METRICS,
	type WordAdsEarningsMetricId,
	type WordAdsHighlightsAttributes,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The wordads/earnings endpoint reports all-time totals and is not
// period-scoped, so the widget ignores the dashboard date range. Report params
// are still accepted at the WidgetRoot boundary (and Storybook may inject them)
// so the host contract holds.
type WordAdsHighlightsRenderAttributes = WordAdsHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type WordAdsHighlightsWidgetProps = WidgetRenderProps< WordAdsHighlightsRenderAttributes >;

// Earnings are currency; formatCurrency renders the connected site's WordAds
// payouts, which are always denominated in USD.
const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { decimals: 2 } };

/**
 * Render-only config per card: the tile icon and the earnings value it shows.
 * Ids and labels are shared with the settings checkboxes via
 * `WORDADS_EARNINGS_METRICS` in `widget.ts`. "Paid" is derived — the payload
 * carries total earnings and the outstanding balance, and paid is their
 * difference — matching the Calypso WordAds Totals section.
 */
const TILE_CONFIG: Record<
	WordAdsEarningsMetricId,
	{ icon: typeof payment; value: ( data?: StatsWordAdsEarningsResponse ) => number }
> = {
	earnings: { icon: payment, value: data => data?.total_earnings ?? 0 },
	paid: {
		icon: receipt,
		value: data => ( data ? data.total_earnings - data.total_amount_owed : 0 ),
	},
	outstanding: { icon: tip, value: data => data?.total_amount_owed ?? 0 },
};

/**
 * Fetches WordAds earnings through the designated `useStatsWordAdsEarnings` hook
 * and renders the totals as a currency `MetricTileGrid`. The earnings module has
 * no comparison period, so each tile shows a bare formatted amount. Which cards
 * appear is controlled by the `metrics` attribute.
 */
function WordAdsHighlightsReport( {
	metrics = DEFAULT_WORDADS_EARNINGS_METRICS,
}: {
	metrics?: WordAdsEarningsMetricId[];
} ) {
	const enabledMetrics = new Set( metrics );
	const hasEnabledMetrics = WORDADS_EARNINGS_METRICS.some( ( { id } ) => enabledMetrics.has( id ) );
	const { data, isLoading, isFetching, isError, refetch } = useStatsWordAdsEarnings( undefined, {
		enabled: hasEnabledMetrics,
	} );

	const tiles = WORDADS_EARNINGS_METRICS.filter( ( { id } ) => enabledMetrics.has( id ) ).map(
		( { id, label } ) => ( {
			key: id,
			label,
			icon: TILE_CONFIG[ id ].icon,
			value: TILE_CONFIG[ id ].value( data ),
		} )
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ ! hasEnabledMetrics }
				error={ {
					description: __(
						"We couldn't load WordAds earnings. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [
						{
							label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
							onClick: () => {
								refetch();
							},
						},
					],
				} }
				empty={ {
					icon: megaphone,
					description: __(
						'Select at least one metric to display.',
						'jetpack-premium-analytics-pkg'
					),
				} }
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ CURRENCY_FORMAT } currencyCode="USD" />
			</WidgetState>
		</div>
	);
}

/**
 * Host attributes are forwarded even though the earnings endpoint is not
 * period-scoped, so injected report params survive the WidgetRoot boundary.
 */
export default function WordAdsHighlights( { attributes = {} }: WordAdsHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<WordAdsHighlightsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
