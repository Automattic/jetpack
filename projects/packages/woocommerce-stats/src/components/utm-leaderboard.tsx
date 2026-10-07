/**
 * External dependencies
 */
import {
	Leaderboard,
	describeError,
	useWidgetRootContext,
	type DataFormat,
	type LeaderboardRowInput,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useMemo, type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { useReportOrderAttribution, type OrderAttributionView } from '../reports';

/** How many UTM values the leaderboard shows. */
const UTM_ROW_LIMIT = 4;

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

type UtmLeaderboardProps = {
	/** The order attribution dimension the sales split by. */
	view: OrderAttributionView;
	/** The icon of the empty state. */
	emptyIcon: ComponentProps< typeof Leaderboard >[ 'empty' ][ 'icon' ];
};

/**
 * Sales of the period split by a UTM dimension, read under the widget root for its report params.
 * The attribution summary reports both periods for every row, so a value with no sales in the
 * comparison period is a real 0.
 *
 * @param {UtmLeaderboardProps} props - The component props.
 * @return {JSX.Element} The leaderboard, or the loading, error or empty state of its report.
 */
export function UtmLeaderboard( { view, emptyIcon }: UtmLeaderboardProps ) {
	const { reportParams } = useWidgetRootContext();
	const params = useMemo( () => ( { ...reportParams, view } ), [ reportParams, view ] );
	const { primary, hasComparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useReportOrderAttribution( params );

	const rows = useMemo< LeaderboardRowInput[] >(
		() =>
			( primary.data?.data ?? [] ).slice( 0, UTM_ROW_LIMIT ).map( ( item, index ) => ( {
				id: item.item || String( index ),
				label: item.item || __( 'Unassigned', 'jetpack-woocommerce-stats-pkg' ),
				value: item.current_period.value || 0,
				previousValue: item.previous_period.value || 0,
			} ) ),
		[ primary.data ]
	);

	return (
		<Leaderboard
			rows={ rows }
			status={ {
				isLoading,
				isFetching,
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load order attribution data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: emptyIcon,
				description: __( 'No attribution data in this period.', 'jetpack-woocommerce-stats-pkg' ),
			} }
			maxRows={ UTM_ROW_LIMIT }
			format={ CURRENCY_FORMAT }
		/>
	);
}
