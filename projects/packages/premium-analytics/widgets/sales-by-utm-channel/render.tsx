/**
 * External dependencies
 */
import { useReportOrderAttribution } from '@jetpack-premium-analytics/data';
import { channel } from '@jetpack-premium-analytics/icons';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	formatLegendLabels,
	useWidgetError,
	useWidgetRootContext,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo, type ComponentProps, type CSSProperties } from 'react';
/**
 * Internal dependencies
 */
import { buildSalesByUtmData } from './helpers/build-sales-by-utm-data';

type SalesByUtmChannelRenderProps = Pick< ComponentProps< typeof WidgetRoot >, 'attributes' > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function SalesByUtmChannelWidget() {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo(
		() => ( {
			...reportParams,
			view: 'channel' as const,
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
				emptyStateIcon={ channel }
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
 * Sales by UTM channel widget.
 *
 * WidgetRoot provides the query client, chart theme, and resolved report params;
 * this render module fetches the order-attribution report and renders the
 * channel leaderboard.
 *
 * @param root0            - Component props.
 * @param root0.attributes - Widget attributes.
 * @param root0.setError   - Dashboard error-state setter.
 * @return The rendered widget.
 */
export default function SalesByUtmChannelRender( {
	attributes,
	setError,
}: SalesByUtmChannelRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmChannelWidget />
		</WidgetRoot>
	);
}
