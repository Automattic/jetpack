import { Container, Col } from '@automattic/jetpack-components';
import React from 'react';
import useProductData from '../../hooks/use-product-data';
import AiCard from './ai-card';
import AntiSpamCard from './anti-spam-card';
import BackupCard from './backup-card';
import BoostCard from './boost-card';
import CrmCard from './crm-card';
import ScanAndProtectCard from './scan-protect-card';
import SearchCard from './search-card';
import SocialCard from './social-card';
import StatsCard from './stats-card';
import styles from './style.module.scss';
import VideopressCard from './videopress-card';

// flag for enabling stats card.
const { showJetpackStatsCard = false } = window.myJetpackInitialState?.myJetpackFlags ?? {};

/**
 * Product cards section component.
 *
 * @returns {object} ProductCardsSection React component.
 */
const ProductCardsSection = () => {
	const { productData, fetchingProductData } = useProductData();

	if ( fetchingProductData ) {
		return null;
	}

	const items = {
		backups: BackupCard,
		scan: ScanAndProtectCard,
		antispam: AntiSpamCard,
		boost: BoostCard,
		search: SearchCard,
		videopress: VideopressCard,
		stats: showJetpackStatsCard ? StatsCard : null,
		crm: CrmCard,
		social: SocialCard,
		ai: AiCard,
	};

	return (
		<Container
			className={ styles.cardlist }
			tagName="ul"
			fluid
			horizontalSpacing={ 0 }
			horizontalGap={ 3 }
		>
			{ Object.entries( items ).map( ( [ key, Item ] ) => {
				if ( ! Item ) {
					return null;
				}

				return (
					<Col tagName="li" sm={ 4 } md={ 4 } lg={ 4 } key={ key }>
						<Item
							admin={ !! window?.myJetpackInitialState?.userIsAdmin }
							productData={ productData[ key ] }
						/>
					</Col>
				);
			} ) }
		</Container>
	);
};

export default ProductCardsSection;
