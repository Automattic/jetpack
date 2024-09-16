import { Container, Col, Text, AdminSectionHero } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import { PRODUCT_SLUGS } from '../../data/constants';
import useProductsByOwnership from '../../data/products/use-products-by-ownership';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import StatsSection from '../stats-section';
import AiCard from './ai-card';
import AntiSpamCard from './anti-spam-card';
import BackupCard from './backup-card';
import BoostCard from './boost-card';
import CreatorCard from './creator-card';
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
};

type DisplayItemType = Record<
	// We don't have a card for Security or Extras, and scan is displayed as protect.
	// 'jetpack-ai' is the official slug for the AI module, so we also exclude 'ai'.
	// The backend still supports the 'ai' slug, so it is part of the JetpackModule type.
	Exclude< JetpackModule, 'extras' | 'scan' | 'security' | 'ai' >,
	FC< { admin: boolean } >
>;

const DisplayItems: FC< DisplayItemsProps > = ( { slugs } ) => {
	const { showFullJetpackStatsCard = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { isAtomic = false, userIsAdmin = false } = getMyJetpackWindowInitialState();

	const items: DisplayItemType = {
		backup: BackupCard,
		protect: ProtectCard,
		'anti-spam': AntiSpamCard,
		boost: BoostCard,
		search: SearchCard,
		videopress: VideopressCard,
		stats: StatsCard,
		crm: CrmCard,
		creator: ! isAtomic ? CreatorCard : null,
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
			{ slugs.includes( 'stats' ) && showFullJetpackStatsCard && (
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
				{ filteredSlugs.map( product => {
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
	noticeMessage: ReactNode;
	siteIsRegistered?: boolean;
}

const ProductCardsSection: FC< ProductCardsSectionProps > = ( {
	noticeMessage,
	siteIsRegistered,
} ) => {
	const { ownedProducts: inntialOwnedProducts = [], unownedProducts: inntialUnownedProducts = [] } =
		getMyJetpackWindowInitialState( 'lifecycleStats' );
	const [ siteOwnedProducts, setSiteOwnedProducts ] = useValueStore(
		'siteOwnedProducts',
		inntialOwnedProducts
	);
	const [ siteUnownedProducts, setSiteUnownedProducts ] = useValueStore(
		'siteUnownedProducts',
		inntialUnownedProducts
	);

	const {
		data: productOwnershipData,
		isLoading,
		refetch: refetchOwnershipData,
	} = useProductsByOwnership();

	useEffect( () => {
		refetchOwnershipData();

		if ( ! isLoading ) {
			const { ownedProducts = [], unownedProducts = [] } = productOwnershipData;
			setSiteOwnedProducts( ownedProducts );
			setSiteUnownedProducts( unownedProducts );
		}
	}, [
		siteIsRegistered,
		productOwnershipData,
		isLoading,
		refetchOwnershipData,
		setSiteOwnedProducts,
		setSiteUnownedProducts,
	] );

	const unownedSectionTitle = useMemo( () => {
		return siteOwnedProducts.length > 0
			? __( 'Discover more', 'jetpack-my-jetpack' )
			: __( 'Discover all Jetpack Products', 'jetpack-my-jetpack' );
	}, [ siteOwnedProducts.length ] );

	const filterProducts = ( products: JetpackModule[] ) => {
		return products.filter( product => {
			if ( product === 'scan' || product === 'security' || product === 'extras' ) {
				return false;
			}
			return true;
		} );
	};

	const filteredOwnedProducts = filterProducts( siteOwnedProducts );
	const filteredUnownedProducts = filterProducts( siteUnownedProducts );

	return (
		<>
			{ filteredOwnedProducts.length > 0 && (
				<AdminSectionHero>
					<Container horizontalSpacing={ 6 } horizontalGap={ noticeMessage ? 3 : 6 }>
						<Col>
							<Col sm={ 4 } md={ 8 } lg={ 12 } className={ styles.cardListTitle }>
								<Text variant="headline-small">{ __( 'My products', 'jetpack-my-jetpack' ) }</Text>
							</Col>

							<DisplayItems slugs={ filteredOwnedProducts } />
						</Col>
					</Container>
				</AdminSectionHero>
			) }

			{ filteredUnownedProducts.length > 0 && (
				<Container horizontalSpacing={ 6 } horizontalGap={ noticeMessage ? 3 : 6 }>
					<Col>
						<Col sm={ 4 } md={ 8 } lg={ 12 } className={ styles.cardListTitle }>
							<Text variant="headline-small">{ unownedSectionTitle }</Text>
						</Col>

						<DisplayItems slugs={ filteredUnownedProducts } />
					</Col>
				</Container>
			) }
		</>
	);
};

export default ProductCardsSection;
