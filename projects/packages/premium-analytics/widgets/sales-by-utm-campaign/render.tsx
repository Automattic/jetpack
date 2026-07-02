/**
 * External dependencies
 */
import { useReportOrderAttribution } from '@jetpack-premium-analytics/data';
import { megaphone } from '@jetpack-premium-analytics/icons';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	buildSalesByUtmData,
	formatLegendLabels,
	useWidgetError,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo, type ComponentProps, type CSSProperties } from 'react';
/**
 * Internal dependencies
 */
import type { SalesByUtmCampaignAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByUtmCampaignRenderAttributes = SalesByUtmCampaignAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByUtmCampaignRenderProps = WidgetRenderProps< SalesByUtmCampaignRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function SalesByUtmCampaignWidget() {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo(
		() => ( {
			...reportParams,
			view: 'campaign' as const,
		} ),
		[ reportParams ]
	);

	const { primary, hasComparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useReportOrderAttribution( params );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const chartData = useMemo( () => buildSalesByUtmData( primary.data ), [ primary.data ] );
	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
			<LeaderboardChart
				data={ chartData }
				withComparison={ hasComparison }
				legendLabels={ legendLabels }
				emptyStateIcon={ megaphone }
				style={
					{
						'--a8c--charts--leaderboard--bar--border-radius': '0 1px 1px 0',
					} as CSSProperties
				}
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

/**
 * Sales by UTM campaign widget.
 *
 * WidgetRoot provides the query client, chart theme, and resolved report params;
 * this render module fetches the order-attribution report and renders the
 * campaign leaderboard.
 */
export default function SalesByUtmCampaignRender( {
	attributes = {},
	setError,
}: SalesByUtmCampaignRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmCampaignWidget />
		</WidgetRoot>
	);
}
