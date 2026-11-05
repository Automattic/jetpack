import { __, _n, sprintf } from '@wordpress/i18n';
import { Link, Stack } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import useStatsVisits from '../../../hooks/use-stats-visits';
import { getDetailedStatsHref, processStatsData } from '../../stats-section';
import OverviewItem from '../overview-item';
import useOverviewLoadEvent from '../overview-item/use-overview-load-event';
import useStatusAction from '../overview-item/use-status-action';
import OverviewStats from './overview-stats';
import { getStatsPeriodVisitsOptions } from './use-stats-period';
import type { StatsPeriod } from './use-stats-period';
import type { FC } from 'react';

type StatsOverviewItemProps = {
	admin: boolean;
	period: Pick< StatsPeriod, 'days' | 'end' >;
};

const StatsOverviewItem: FC< StatsOverviewItemProps > = ( { admin, period } ) => {
	const { blogID, isSiteConnected } = useMyJetpackConnection();
	const { detail, isLoading: isProductLoading } = useProduct( PRODUCT_SLUGS.STATS );
	const { status, manageUrl } = detail || {};
	const { premiumAnalyticsEnabled = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { recordEvent } = useAnalytics();
	const isActive = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const { days, end } = period;
	const visitsOptions = useMemo(
		() => getStatsPeriodVisitsOptions( { days, end } ),
		[ days, end ]
	);
	const { data, isLoading, isFetching, isError, refetch } = useStatsVisits(
		blogID,
		isSiteConnected && isActive,
		visitsOptions
	);
	const { counts, chartData } = useMemo( () => processStatsData( data, days ), [ data, days ] );
	const isRetrying = isError && isFetching;
	const isStatsLoading = isLoading || isRetrying;
	useOverviewLoadEvent( PRODUCT_SLUGS.STATS, isActive && isStatsLoading );
	const { action: statusAction, forcedOffReason } = useStatusAction(
		PRODUCT_SLUGS.STATS,
		__( 'Activate Stats', 'jetpack-my-jetpack' ),
		null
	);

	const onDetailedStatsClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_stats_card_seedetailedstats_click', {
			product: PRODUCT_SLUGS.STATS,
		} );
	}, [ recordEvent ] );

	const detailedStatsHref = getDetailedStatsHref( manageUrl, premiumAnalyticsEnabled );

	// The status arrives with the products request, so the card shows its skeleton until then too.
	if ( isProductLoading || ( isActive && ( isStatsLoading || ! isError ) ) ) {
		return (
			<Stack direction="column" gap="lg">
				<OverviewStats
					isLoading={ isProductLoading || isStatsLoading }
					counts={ counts }
					chartData={ chartData }
					detailedStatsHref={ detailedStatsHref }
					onDetailedStatsClick={ onDetailedStatsClick }
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

	return (
		<OverviewItem
			slug={ PRODUCT_SLUGS.STATS }
			admin={ admin }
			label={ sprintf(
				/* translators: %d: number of days. */
				_n( 'Views in the last %d day', 'Views in the last %d days', days, 'jetpack-my-jetpack' ),
				days
			) }
			action={ isActive ? undefined : statusAction }
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
