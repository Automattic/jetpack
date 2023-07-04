import { Container, Col } from '@automattic/jetpack-components';
import React from 'react';
import AiCard from './ai-card';
import AntiSpamCard from './anti-spam-card';
import BackupCard from './backup-card';
import BlazeCard from './blaze-card';
import BoostCard from './boost-card';
import CrmCard from './crm-card';
import ScanAndProtectCard from './scan-protect-card';
import SearchCard from './search-card';
import SocialCard from './social-card';
import StatsCard from './stats-card';
import styles from './style.module.scss';
import VideopressCard from './videopress-card';

/**
 * Product cards section component.
 *
 * @returns {object} ProductCardsSection React component.
 */
const ProductCardsSection = () => {
	const items = [
		BackupCard,
		ScanAndProtectCard,
		AntiSpamCard,
		BoostCard,
		SearchCard,
		VideopressCard,
		StatsCard,
		CrmCard,
		SocialCard,
		AiCard,
		BlazeCard,
	];

	return (
		<Container
			className={ styles.cardlist }
			tagName="ul"
			fluid
			horizontalSpacing={ 0 }
			horizontalGap={ 3 }
		>
			{ items.map( ( Item, index ) => (
				<Col tagName="li" sm={ 4 } md={ 4 } lg={ 4 } key={ index }>
					<Item admin={ true } />
				</Col>
			) ) }
		</Container>
	);
};

export default ProductCardsSection;
