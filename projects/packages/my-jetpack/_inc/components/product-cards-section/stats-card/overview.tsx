import { __ } from '@wordpress/i18n';
import { Link, Stack } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import useStatsVisits from '../../../hooks/use-stats-visits';
import { getDetailedStatsHref, processStatsData, VISITS_OPTIONS } from '../../stats-section';
import StatsCards from '../../stats-section/cards';
import OverviewItem from '../overview-item';
import useOverviewLoadEvent from '../overview-item/use-overview-load-event';
import useStatusAction from '../overview-item/use-status-action';
import type { ProductCardComponent } from '../types';

const StatsOverviewItem: ProductCardComponent = ( { admin } ) => {
	const { blogID, isSiteConnected } = useMyJetpackConnection();
	const { detail } = useProduct( PRODUCT_SLUGS.STATS );
	const { status, manageUrl } = detail || {};
	const { premiumAnalyticsEnabled = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { recordEvent } = useAnalytics();
	const isActive = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const { data, isLoading, isFetching, isError, refetch } = useStatsVisits(
		blogID,
		isSiteConnected && isActive,
		VISITS_OPTIONS
	);
	const { counts, previousCounts, chartData } = useMemo( () => processStatsData( data ), [ data ] );
	const isRetrying = isError && isFetching;
	const isStatsLoading = isLoading || isRetrying;
	useOverviewLoadEvent( PRODUCT_SLUGS.STATS, isActive && isStatsLoading );
	const { action: statusAction, forcedOffReason } = useStatusAction(
		PRODUCT_SLUGS.STATS,
		__( 'Activate Stats', 'jetpack-my-jetpack' )
	);

	const onDetailedStatsClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_stats_card_seedetailedstats_click', {
			product: PRODUCT_SLUGS.STATS,
		} );
	}, [ recordEvent ] );

	const detailedStatsHref = getDetailedStatsHref( manageUrl, premiumAnalyticsEnabled );

	if ( isActive && ! isStatsLoading && ! isError ) {
		return (
			<Stack direction="column" gap="lg">
				<StatsCards
					counts={ counts }
					previousCounts={ previousCounts }
					chartData={ chartData }
					headingLevel={ 4 }
					isLoading={ false }
					detailedStatsHref={ detailedStatsHref }
					onDetailedStatsClick={ onDetailedStatsClick }
					hideTitle
					chartBelowCounts
				/>
				{ detailedStatsHref && (
					<div>
						<Link href={ detailedStatsHref } onClick={ onDetailedStatsClick }>
							{ __( 'More stats', 'jetpack-my-jetpack' ) }
						</Link>
					</div>
				) }
			</Stack>
		);
	}

	// The item stands in for the chart until there is data, as the chart's counts read 0 before it.
	return (
		<OverviewItem
			slug={ PRODUCT_SLUGS.STATS }
			admin={ admin }
			label={ __( 'Views in the last 7 days', 'jetpack-my-jetpack' ) }
			action={ isActive ? undefined : statusAction }
			isLoading={ isActive && isStatsLoading }
			error={
				isActive && isError
					? {
							reason: __( 'Failed to load stats', 'jetpack-my-jetpack' ),
							onRetry: refetch,
						}
					: undefined
			}
			forcedOffReason={ forcedOffReason }
		/>
	);
};

export default StatsOverviewItem;
