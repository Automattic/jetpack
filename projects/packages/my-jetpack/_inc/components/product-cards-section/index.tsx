import { Col, Container } from '@automattic/jetpack-components';
import { PRODUCT_SLUGS } from '../../data/constants';
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

const DisplayItems: FC< DisplayItemsProps > = ( { slugs, isLoading } ) => {
	const mockArrayOfProducts = [ ...Array( 9 ).keys() ];
	const { showFullJetpackStatsCard = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { userIsAdmin = false } = getMyJetpackWindowInitialState();

	const items: DisplayItemType = {
		backup: BackupCard,
		protect: ProtectCard,
		'anti-spam': AntiSpamCard,
		boost: BoostCard,
		search: SearchCard,
		videopress: VideopressCard,
		stats: StatsCard,
		crm: CrmCard,
		social: SocialCard,
		'jetpack-ai': AiCard,
	};

	const filteredSlugs = slugs.filter( slug => {
		if ( slug === PRODUCT_SLUGS.STATS && showFullJetpackStatsCard ) {
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
			{ ! isLoading && slugs.includes( 'stats' ) && showFullJetpackStatsCard && (
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
				{ isLoading
					? mockArrayOfProducts.map( ( _, index ) => (
							<Col tagName="li" sm={ 4 } md={ 4 } lg={ 4 } key={ index }>
								<LoadingBlock width="100%" height="200px" />
							</Col>
					  ) )
					: filteredSlugs.map( product => {
							const Item = items[ product ];

							return (
								<Col tagName="li" sm={ 4 } md={ 4 } lg={ 4 } key={ product }>
									<Item admin={ userIsAdmin === '1' } />
								</Col>
							);
					  } ) }
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
