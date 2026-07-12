/**
 * External dependencies
 */
import {
	useReportOrderAttribution,
	ORDER_ATTRIBUTION_VIEWS,
} from '@jetpack-premium-analytics/data';
import { megaphone, search, channel } from '@jetpack-premium-analytics/icons';
import { useMemo, type CSSProperties } from 'react';
import { LeaderboardChart } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildSalesByUtmData, formatLegendLabels } from '../../helpers';
import { useWidgetError } from '../../hooks';

type OrderAttributionView = ( typeof ORDER_ATTRIBUTION_VIEWS )[ number ];

type SalesByUtmWidgetProps = {
	/**
	 * The order attribution view to display (source, channel, campaign, etc.)
	 */
	view: OrderAttributionView;
};

/**
 * Sales by UTM Widget Component
 *
 * Displays order attribution data in a leaderboard chart, showing how sales are
 * distributed across different UTM parameters (source, channel, or campaign).
 *
 * Features:
 * - Multiple views: source, channel, campaign
 * - Displays data for all product types
 * - Comparison support (current vs previous period)
 * - Formatted legend labels with date ranges
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @param props      - Component props
 * @param props.view - The order attribution view (source, channel, campaign)
 *
 * @example
 * <WidgetRoot attributes={ attributes }>
 *   <SalesByUtmWidget view="source" />
 * </WidgetRoot>
 */
export function SalesByUtmWidget( { view }: SalesByUtmWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo(
		() => ( {
			...reportParams,
			view,
		} ),
		[ reportParams, view ]
	);

	const { primary, hasComparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useReportOrderAttribution( params );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const chartData = useMemo( () => buildSalesByUtmData( primary.data ), [ primary.data ] );

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const emptyStateIcon = useMemo( () => {
		switch ( view ) {
			case 'source':
				return search;
			case 'channel':
				return channel;
			case 'campaign':
				return megaphone;
			default:
				return search;
		}
	}, [ view ] );

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
				emptyStateIcon={ emptyStateIcon }
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
