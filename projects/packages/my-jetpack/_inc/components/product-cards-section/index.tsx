import { Col, Container } from '@automattic/jetpack-components';
import { PRODUCT_STATUSES } from '../../constants';
import { PRODUCT_SLUGS } from '../../data/constants';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useFilteredProducts from '../../hooks/use-filtered-products';
import LoadingBlock from '../loading-block';
import StatsSection from '../stats-section';
import AiCard from './ai-card';
import AntiSpamCard from './anti-spam-card';
import BackupCard from './backup-card';
import BoostCard from './boost-card';
import CrmCard from './crm-card';
import ProtectCard from './protect-card';
import SearchCard from './search-card';
import SocialCard from './social-card';
import StatsCard from './stats-card';
import styles from './style.module.scss';
import VideopressCard from './videopress-card';
import type { FC, ReactNode } from 'react';

type DisplayItemsProps = {
	slugs: JetpackModule[];
	isLoading: boolean;
};

type DisplayItemType = Record<
	// We don't have a card for these products/bundles, and scan is displayed as protect.
	// 'jetpack-ai' is the official slug for the AI module, so we also exclude 'ai'.
	// The backend still supports the 'ai' slug, so it is part of the JetpackModule type.
	// Related-posts, newsletter, and site-accelerator are features, not products.
	JetpackModuleWithCard,
	FC< { admin: boolean } >
>;

/**
 * Determine whether the large "Views in the last 7 days" Stats card should be shown.
 *
 * It only appears when the feature flag is on, the user can view stats, AND the Stats module
 * is active (`active` / `can_upgrade`). When the module is disabled the large card would render
 * as an empty, non-actionable graph linking to an inaccessible page, so it is hidden in favour
 * of the compact card below.
 *
 * @param {boolean}                 showFullJetpackStatsCard - Whether the full stats card flag is enabled.
 * @param {boolean}                 canUserViewStats         - Whether the current user can view stats.
 * @param {ProductStatus|undefined} statsStatus              - Current status of the Stats product.
 * @return {boolean} Whether to render the large Stats card.
 */
export const shouldShowFullStatsCard = (
	showFullJetpackStatsCard: boolean,
	canUserViewStats: boolean,
	statsStatus: ProductStatus | undefined
): boolean =>
	showFullJetpackStatsCard &&
	canUserViewStats &&
	( statsStatus === PRODUCT_STATUSES.ACTIVE || statsStatus === PRODUCT_STATUSES.CAN_UPGRADE );

/**
 * Determine whether the compact "Activate Stats" card should be shown in the grid.
 *
 * Shown whenever the Stats module is not active (disabled, needs connection, etc.) so the user
 * always has an activation entry point in place of the large graph. A disabled Stats module is
 * reported as "unowned", so this is driven off the Stats product status rather than the
 * owned-products list — that keeps it stable and avoids a flicker while ownership data settles.
 *
 * @param {boolean}                 showFullJetpackStatsCard - Whether the full stats card flag is enabled.
 * @param {boolean}                 canUserViewStats         - Whether the current user can view stats.
 * @param {ProductStatus|undefined} statsStatus              - Current status of the Stats product (undefined while loading).
 * @return {boolean} Whether to render the compact Stats card.
 */
export const shouldShowCompactStatsCard = (
	showFullJetpackStatsCard: boolean,
	canUserViewStats: boolean,
	statsStatus: ProductStatus | undefined
): boolean =>
	showFullJetpackStatsCard &&
	canUserViewStats &&
	statsStatus !== undefined &&
	! shouldShowFullStatsCard( showFullJetpackStatsCard, canUserViewStats, statsStatus );

const DisplayItems: FC< DisplayItemsProps > = ( { slugs, isLoading } ) => {
	const mockArrayOfProducts = [ ...Array( 9 ).keys() ];
	const { showFullJetpackStatsCard = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { userIsAdmin = false, canUserViewStats = false } = getMyJetpackWindowInitialState();
	const { detail: statsDetail } = useProduct( PRODUCT_SLUGS.STATS );
	const statsStatus = statsDetail?.status;
	const showFullStatsCard = shouldShowFullStatsCard(
		showFullJetpackStatsCard,
		canUserViewStats,
		statsStatus
	);
	const showCompactStatsCard = shouldShowCompactStatsCard(
		showFullJetpackStatsCard,
		canUserViewStats,
		statsStatus
	);
	const isAdmin = userIsAdmin === '1';

	const items: DisplayItemType = {
		backup: BackupCard,
		protect: ProtectCard,
		'anti-spam': AntiSpamCard,
		boost: BoostCard,
		search: SearchCard,
		videopress: VideopressCard,
		stats: StatsCard, // Rendered explicitly when showFullJetpackStatsCard is on; otherwise via the grid loop below.
		crm: CrmCard,
		social: SocialCard,
		'jetpack-ai': AiCard,
	};

	// When we render Stats explicitly (the large card above the grid, or the compact card prepended
	// into it) remove it from the owned-products loop so it isn't rendered twice. When neither
	// explicit card applies — e.g. the full-stats-card flag is off in a standalone plugin that
	// doesn't bundle the main Jetpack plugin — leave it in the loop so it still renders as a grid card.
	const statsRenderedExplicitly = showFullStatsCard || showCompactStatsCard;
	const filteredSlugs = slugs.filter( slug => {
		if ( slug === PRODUCT_SLUGS.STATS && statsRenderedExplicitly ) {
			return false;
		}

		if ( ! items[ slug ] ) {
			return false;
		}

		return true;
	} );

	return (
		<>
			{ isLoading && (
				<Col className={ styles.fullStatsCard }>
					<LoadingBlock width="100%" height="350px" />
				</Col>
			) }
			{ ! isLoading && showFullStatsCard && (
				<Col className={ styles.fullStatsCard }>
					<StatsSection />
				</Col>
			) }

			<Container
				className={ styles.cardlist }
				tagName="ul"
				fluid
				horizontalSpacing={ 0 }
				horizontalGap={ 3 }
			>
				{ isLoading ? (
					mockArrayOfProducts.map( ( _, index ) => (
						<Col tagName="li" sm={ 4 } md={ 4 } lg={ 4 } key={ index }>
							<LoadingBlock width="100%" height="200px" />
						</Col>
					) )
				) : (
					<>
						{ showCompactStatsCard && (
							<Col tagName="li" sm={ 4 } md={ 4 } lg={ 4 } key="stats">
								<StatsCard admin={ isAdmin } />
							</Col>
						) }
						{ filteredSlugs.map( product => {
							const Item = items[ product ];

							return (
								<Col tagName="li" sm={ 4 } md={ 4 } lg={ 4 } key={ product }>
									<Item admin={ isAdmin } />
								</Col>
							);
						} ) }
					</>
				) }
			</Container>
		</>
	);
};

interface ProductCardsSectionProps {
	noticeMessage?: ReactNode;
}

const ProductCardsSection: FC< ProductCardsSectionProps > = ( { noticeMessage } ) => {
	const { filteredOwnedProducts, isLoading } = useFilteredProducts();

	return (
		<>
			{ ( isLoading || filteredOwnedProducts.length > 0 ) && (
				<Container
					horizontalSpacing={ 0 }
					horizontalGap={ noticeMessage ? 3 : 6 }
					className={ styles[ 'products-container' ] }
				>
					<Col>
						<DisplayItems isLoading={ isLoading } slugs={ filteredOwnedProducts } />
					</Col>
				</Container>
			) }
		</>
	);
};

export default ProductCardsSection;
