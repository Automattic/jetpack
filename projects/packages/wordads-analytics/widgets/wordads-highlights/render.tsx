/**
 * External dependencies
 */
import {
	type DataFormat,
	MetricTileGrid,
	MetricTileGridSkeleton,
	type ReportParamsFieldAttributes,
	type StatsWordAdsEarningsResponse,
	useStatsWordAdsEarnings,
	WidgetRoot,
	WidgetState,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { payment, receipt, tip } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import {
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
const CURRENCY_FORMAT: DataFormat = { type: 'currency' };

/**
 * Render-only per-card config. "Paid" is derived (earnings − outstanding balance),
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
 * comparison period, so each tile shows a bare amount.
 */
function WordAdsHighlightsReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsWordAdsEarnings();

	const tiles = WORDADS_EARNINGS_METRICS.map( ( { id, label } ) => ( {
		key: id,
		label,
		icon: TILE_CONFIG[ id ].icon,
		value: TILE_CONFIG[ id ].value( data ),
	} ) );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				// A zero balance is a real $0.00, never an empty state.
				isEmpty={ false }
				error={ {
					description: __(
						"We couldn't load WordAds earnings. Please try again in a moment.",
						'jetpack-wordads-analytics-pkg'
					),
					actions: [
						{
							label: __( 'Retry', 'jetpack-wordads-analytics-pkg' ),
							onClick: () => {
								refetch();
							},
						},
					],
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
			<WordAdsHighlightsReport />
		</WidgetRoot>
	);
}
