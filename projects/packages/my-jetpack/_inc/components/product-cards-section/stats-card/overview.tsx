import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import useStatsVisits from '../../../hooks/use-stats-visits';
import formatNumber from '../../../utils/format-number';
import { processStatsData, VISITS_OPTIONS } from '../../stats-section';
import OverviewCard from '../overview-card';
import type { ProductCardComponent } from '../types';

const StatsOverviewCard: ProductCardComponent = ( { admin } ) => {
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
	const views = useMemo( () => processStatsData( data ).counts.views, [ data ] );

	const onDetailedStatsClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_stats_card_seedetailedstats_click', {
			product: PRODUCT_SLUGS.STATS,
		} );
	}, [ recordEvent ] );

	const viewStatsQuery = premiumAnalyticsEnabled ? '' : '&force_refresh=1';
	const action =
		isActive && manageUrl
			? {
					label: __( 'View detailed stats', 'jetpack-my-jetpack' ),
					href: `${ manageUrl }${ viewStatsQuery }`,
					onClick: onDetailedStatsClick,
				}
			: undefined;

	return (
		<OverviewCard
			slug={ PRODUCT_SLUGS.STATS }
			admin={ admin }
			label={ __( 'Views in the last 7 days', 'jetpack-my-jetpack' ) }
			value={ isActive && data && views !== undefined ? formatNumber( views ) : undefined }
			action={ action }
			isLoading={ isActive && isLoading }
			error={
				isActive && isError
					? {
							reason: __( 'Your stats could not be loaded.', 'jetpack-my-jetpack' ),
							onRetry: refetch,
						}
					: undefined
			}
		/>
	);
};

export default StatsOverviewCard;
