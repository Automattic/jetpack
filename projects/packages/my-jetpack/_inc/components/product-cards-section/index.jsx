import { Container, Col } from '@automattic/jetpack-components';
import React from 'react';
import AiCard from './ai-card';
import AntiSpamCard from './anti-spam-card';
import BackupCard from './backup-card';
import BoostCard from './boost-card';
import CreatorCard from './creator-card';
import CrmCard from './crm-card';
import ProtectCard from './protect-card';
import SearchCard from './search-card';
import SocialCard from './social-card';
import styles from './style.module.scss';
import VideopressCard from './videopress-card';

/**
 * Product cards section component.
 *
 * @returns {object} ProductCardsSection React component.
 */
const ProductCardsSection = () => {
	const items = {
		backups: BackupCard,
		protect: ProtectCard,
		antispam: AntiSpamCard,
		boost: BoostCard,
		search: SearchCard,
		videopress: VideopressCard,
		// Stats card is shown in the <StatsSection/> component.
		crm: CrmCard,
		creator: CreatorCard,
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
						<Item admin={ !! window?.myJetpackInitialState?.userIsAdmin } />
					</Col>
				);
			} ) }
		</Container>
	);
};

export default ProductCardsSection;
