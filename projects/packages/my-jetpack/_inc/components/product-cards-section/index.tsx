import { Container, Col, Text, AdminSectionHero } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { PRODUCT_SLUGS } from '../../data/constants';
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
}

const ProductCardsSection: FC< ProductCardsSectionProps > = ( { noticeMessage } ) => {
	const { ownedProducts = [], unownedProducts = [] } =
		getMyJetpackWindowInitialState( 'lifecycleStats' );

	const unownedSectionTitle = useMemo( () => {
		return ownedProducts.length > 0
			? __( 'Discover more', 'jetpack-my-jetpack' )
			: __( 'Discover all Jetpack Products', 'jetpack-my-jetpack' );
	}, [ ownedProducts.length ] );

	const filterProducts = ( products: JetpackModule[] ) => {
		return products.filter( product => {
			if ( product === 'scan' || product === 'security' || product === 'extras' ) {
				return false;
			}
			return true;
		} );
	};

	const filteredOwnedProducts = filterProducts( ownedProducts );
	const filteredUnownedProducts = filterProducts( unownedProducts );

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
