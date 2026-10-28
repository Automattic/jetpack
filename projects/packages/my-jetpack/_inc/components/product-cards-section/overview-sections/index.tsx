import { __ } from '@wordpress/i18n';
import { dashboard, shield, trendingUp } from '@wordpress/icons';
import clsx from 'clsx';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useFilteredProducts from '../../../hooks/use-filtered-products';
import LoadingBlock from '../../loading-block';
import BackupOverviewItem from '../backup-card/overview';
import BoostOverviewItem from '../boost-card/overview';
import ProductOverviewItem from '../overview-item/product-item';
import OverviewSection from '../overview-section';
import ProtectOverviewItem from '../protect-card/overview';
import StatsOverviewItem from '../stats-card/overview';
import StatsPeriodControl from '../stats-card/period-control';
import { useStatsPeriod } from '../stats-card/use-stats-period';
import VideoPressOverviewItem from '../videopress-card/overview';
import styles from './style.module.scss';
import type { FC } from 'react';

/**
 * The Overview sections.
 *
 * @param {object} props           - Component props.
 * @param {string} props.className - Added once the sections have loaded.
 * @return {import('react').JSX.Element} The sections.
 */
const OverviewSections: FC< { className?: string } > = ( { className = '' } ) => {
	const { filteredOwnedProducts: slugs, isLoading } = useFilteredProducts();
	const { showFullJetpackStatsCard = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { userIsAdmin = false, canUserViewStats = false } = getMyJetpackWindowInitialState();
	const admin = userIsAdmin === '1';
	// showFullJetpackStatsCard means Jetpack or the Stats plugin is active.
	const showStats =
		canUserViewStats && ( showFullJetpackStatsCard || slugs.includes( PRODUCT_SLUGS.STATS ) );
	const { detail: statsDetail } = useProduct( PRODUCT_SLUGS.STATS );
	const isStatsActive =
		statsDetail?.status === PRODUCT_STATUSES.ACTIVE ||
		statsDetail?.status === PRODUCT_STATUSES.CAN_UPGRADE;
	const statsPeriod = useStatsPeriod();
	const owns = ( slug: JetpackModule ) => slugs.includes( slug );
	const protectedItems = [
		owns( PRODUCT_SLUGS.ANTI_SPAM ) && (
			<ProductOverviewItem
				key="anti-spam"
				slug={ PRODUCT_SLUGS.ANTI_SPAM }
				admin={ admin }
				actionLabel={ __( 'More insights', 'jetpack-my-jetpack' ) }
			/>
		),
		owns( PRODUCT_SLUGS.BACKUP ) && <BackupOverviewItem key="backup" admin={ admin } />,
		owns( PRODUCT_SLUGS.PROTECT ) && <ProtectOverviewItem key="protect" admin={ admin } />,
	].filter( Boolean );
	const statusItems = [
		owns( PRODUCT_SLUGS.BOOST ) && <BoostOverviewItem key="boost" admin={ admin } />,
		owns( PRODUCT_SLUGS.JETPACK_AI ) && (
			<ProductOverviewItem
				key="jetpack-ai"
				slug={ PRODUCT_SLUGS.JETPACK_AI }
				admin={ admin }
				actionLabel={ __( 'More about AI', 'jetpack-my-jetpack' ) }
				upgradeLabel={ __( 'Increase usage', 'jetpack-my-jetpack' ) }
			/>
		),
		owns( PRODUCT_SLUGS.SEARCH ) && (
			<ProductOverviewItem
				key="search"
				slug={ PRODUCT_SLUGS.SEARCH }
				admin={ admin }
				actionLabel={ __( 'More about Search', 'jetpack-my-jetpack' ) }
			/>
		),
		owns( PRODUCT_SLUGS.VIDEOPRESS ) && <VideoPressOverviewItem key="videopress" admin={ admin } />,
		owns( PRODUCT_SLUGS.CRM ) && (
			<ProductOverviewItem
				key="crm"
				slug={ PRODUCT_SLUGS.CRM }
				admin={ admin }
				actionLabel={ __( 'Manage CRM', 'jetpack-my-jetpack' ) }
			/>
		),
		owns( PRODUCT_SLUGS.SOCIAL ) && (
			<ProductOverviewItem
				key="social"
				slug={ PRODUCT_SLUGS.SOCIAL }
				admin={ admin }
				actionLabel={ __( 'Manage Social', 'jetpack-my-jetpack' ) }
			/>
		),
	].filter( Boolean );

	if ( ! isLoading && ! showStats && ! protectedItems.length && ! statusItems.length ) {
		return null;
	}

	return (
		<div className={ clsx( styles.sections, { [ className ]: ! isLoading } ) }>
			{ isLoading ? (
				<>
					<LoadingBlock width="100%" height="350px" />
					<LoadingBlock width="100%" height="150px" />
					<LoadingBlock width="100%" height="150px" />
				</>
			) : (
				<>
					{ showStats && (
						<OverviewSection
							icon={ trendingUp }
							title={ __( 'How is your site growing?', 'jetpack-my-jetpack' ) }
							headerEnd={ isStatsActive && <StatsPeriodControl period={ statsPeriod } /> }
						>
							<StatsOverviewItem admin={ admin } period={ statsPeriod } />
						</OverviewSection>
					) }
					{ protectedItems.length > 0 && (
						<OverviewSection
							icon={ shield }
							title={ __( 'How well is my site protected?', 'jetpack-my-jetpack' ) }
						>
							{ protectedItems }
						</OverviewSection>
					) }
					{ statusItems.length > 0 && (
						<OverviewSection
							icon={ dashboard }
							title={ __( 'What is my site status?', 'jetpack-my-jetpack' ) }
						>
							{ statusItems }
						</OverviewSection>
					) }
				</>
			) }
		</div>
	);
};

export default OverviewSections;
