import { Container, Col, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
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
import type { FC } from 'react';

type DisplayItemsProps = {
	slugs: JetpackModule[];
};

const DisplayItems: FC< DisplayItemsProps > = ( { slugs } ) => {
	const { showFullJetpackStatsCard = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { isAtomic = false, userIsAdmin = false } = getMyJetpackWindowInitialState();

	const items = {
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
		ai: AiCard,
	};

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
				{ slugs.map( product => {
					if ( product === 'stats' && showFullJetpackStatsCard ) {
						return null;
					}

					const Item = items[ product ];
					if ( ! Item ) {
						return null;
					}

					return (
						<Col tagName="li" sm={ 4 } md={ 4 } lg={ 4 } key={ product }>
							<Item admin={ !! userIsAdmin } />
						</Col>
					);
				} ) }
			</Container>
		</>
	);
};

const ProductCardsSection = () => {
	const { ownedProducts = [], unownedProducts = [] } =
		getMyJetpackWindowInitialState( 'lifecycleStats' );

	return (
		<>
			{ ownedProducts.length > 0 && (
				<div className={ styles.ownedProductsSection }>
					<Col sm={ 4 } md={ 8 } lg={ 12 } className={ styles.cardListTitle }>
						<Text variant="headline-small">{ __( 'My products', 'jetpack-my-jetpack' ) }</Text>
					</Col>

					<DisplayItems slugs={ ownedProducts } />
				</div>
			) }

			{ unownedProducts.length > 0 && (
				<div className={ styles.unownedProductsSection }>
					<Col sm={ 4 } md={ 8 } lg={ 12 } className={ styles.cardListTitle }>
						{ ownedProducts.length > 0 ? (
							<Text variant="headline-small">{ __( 'Discover more', 'jetpack-my-jetpack' ) }</Text>
						) : (
							<Text variant="headline-small">
								{ __( 'Discover all Jetpack Products', 'jetpack-my-jetpack' ) }
							</Text>
						) }
					</Col>

					<DisplayItems slugs={ unownedProducts } />
				</div>
			) }
		</>
	);
};

export default ProductCardsSection;
