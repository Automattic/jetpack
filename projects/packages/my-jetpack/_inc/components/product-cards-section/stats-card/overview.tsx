import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
import { MyJetpackRoutes, PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import useStatsVisits from '../../../hooks/use-stats-visits';
import { processStatsData, VISITS_OPTIONS } from '../../stats-section';
import StatsCards from '../../stats-section/cards';
import OverviewItem from '../overview-item';
import useOverviewLoadEvent from '../overview-item/use-overview-load-event';
import styles from './style.module.scss';
import type { ProductCardComponent } from '../types';

const StatsOverviewItem: ProductCardComponent = ( { admin } ) => {
	const { blogID, isSiteConnected } = useMyJetpackConnection();
	const { detail } = useProduct( PRODUCT_SLUGS.STATS );
	const { status, manageUrl } = detail || {};
	const { premiumAnalyticsEnabled = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { recordEvent } = useAnalytics();
	const isActive = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const { data, isLoading, isError, refetch } = useStatsVisits(
		blogID,
		isSiteConnected && isActive,
		VISITS_OPTIONS as Parameters< typeof useStatsVisits >[ 2 ]
	);
	const { counts, previousCounts, chartData } = useMemo(
		() =>
			processStatsData( data ) as {
				counts: object;
				previousCounts: object;
				chartData: Parameters< typeof StatsCards >[ 0 ][ 'chartData' ];
			},
		[ data ]
	);
	useOverviewLoadEvent( PRODUCT_SLUGS.STATS, isActive && isLoading );

	const onDetailedStatsClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_stats_card_seedetailedstats_click', {
			product: PRODUCT_SLUGS.STATS,
		} );
	}, [ recordEvent ] );

	const viewStatsQuery = premiumAnalyticsEnabled ? '' : '&force_refresh=1';
	const detailedStatsHref = manageUrl ? `${ manageUrl }${ viewStatsQuery }` : undefined;
	const label = __( 'Views in the last 7 days', 'jetpack-my-jetpack' );

	if ( ! isActive ) {
		return (
			<OverviewItem
				slug={ PRODUCT_SLUGS.STATS }
				admin={ admin }
				label={ label }
				action={ {
					label: __( 'Activate Stats', 'jetpack-my-jetpack' ),
					href: `#${ MyJetpackRoutes.AddStats }`,
				} }
			/>
		);
	}

	// The chart's counts read 0 until data arrives, so show the item's loading state instead.
	if ( isLoading ) {
		return <OverviewItem slug={ PRODUCT_SLUGS.STATS } admin={ admin } label={ label } isLoading />;
	}

	if ( isError ) {
		return (
			<OverviewItem
				slug={ PRODUCT_SLUGS.STATS }
				admin={ admin }
				label={ label }
				error={ {
					reason: __( 'Failed to load stats', 'jetpack-my-jetpack' ),
					onRetry: refetch,
				} }
			/>
		);
	}

	return (
		<div className={ styles.growth }>
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
			{ admin && detailedStatsHref && (
				<Link href={ detailedStatsHref } onClick={ onDetailedStatsClick }>
					{ __( 'More stats', 'jetpack-my-jetpack' ) }
				</Link>
			) }
		</div>
	);
};

export default StatsOverviewItem;
