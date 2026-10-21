import { __ } from '@wordpress/i18n';
import { dashboard, shield, trendingUp } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useFilteredProducts from '../../../hooks/use-filtered-products';
import LoadingBlock from '../../loading-block';
import BoostOverviewItem from '../boost-card/overview';
import OverviewSection from '../overview-section';
import ProtectOverviewItem from '../protect-card/overview';
import StatsOverviewItem from '../stats-card/overview';
import styles from './style.module.scss';
import type { FC } from 'react';

/**
 * The Overview heading and its sections.
 *
 * @return {import('react').JSX.Element} The sections.
 */
const OverviewSections: FC = () => {
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
	const showProtect = slugs.includes( PRODUCT_SLUGS.PROTECT );
	const showBoost = slugs.includes( PRODUCT_SLUGS.BOOST );

	if ( ! isLoading && ! showStats && ! showProtect && ! showBoost ) {
		return null;
	}

	return (
		<div className={ styles.sections }>
			<Text variant="heading-xl" render={ <h2 /> } className={ styles.welcome }>
				{ __( 'Welcome to Jetpack', 'jetpack-my-jetpack' ) }
			</Text>
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
							headerEnd={
								isStatsActive && (
									<Text variant="body-md">{ __( 'Last 7 days', 'jetpack-my-jetpack' ) }</Text>
								)
							}
						>
							<StatsOverviewItem admin={ admin } />
						</OverviewSection>
					) }
					{ showProtect && (
						<OverviewSection
							icon={ shield }
							title={ __( 'How well is my site protected?', 'jetpack-my-jetpack' ) }
						>
							<ProtectOverviewItem admin={ admin } />
						</OverviewSection>
					) }
					{ showBoost && (
						<OverviewSection
							icon={ dashboard }
							title={ __( 'What is my site status?', 'jetpack-my-jetpack' ) }
						>
							<BoostOverviewItem admin={ admin } />
						</OverviewSection>
					) }
				</>
			) }
		</div>
	);
};

export default OverviewSections;
