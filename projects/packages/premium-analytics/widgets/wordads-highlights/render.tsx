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
	MetricTileGridSkeleton,
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

// The wordads/earnings endpoint is all-time and not period-scoped, so the widget
// ignores the dashboard date range; report params still flow to WidgetRoot for the host contract.
type WordAdsHighlightsRenderAttributes = WordAdsHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type WordAdsHighlightsWidgetProps = WidgetRenderProps< WordAdsHighlightsRenderAttributes >;

// Earnings are currency; formatCurrency renders the connected site's WordAds
// payouts, which are always denominated in USD.
const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { decimals: 2 } };

/**
 * Render-only per-card config; ids/labels shared with the settings checkboxes via
 * `WORDADS_EARNINGS_METRICS`. "Paid" is derived (earnings − outstanding balance),
 * matching the Calypso WordAds Totals section.
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
 * Renders WordAds earnings as currency tiles. The earnings module has no
 * comparison period, so each tile shows a bare amount; `metrics` controls which
 * cards appear.
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
				renderLoading={ <MetricTileGridSkeleton tiles={ tiles.length } /> }
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
