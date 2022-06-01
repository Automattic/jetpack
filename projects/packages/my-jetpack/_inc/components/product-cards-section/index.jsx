import { Container, Col } from '@automattic/jetpack-components';
import React from 'react';
import AntiSpamCard from './anti-spam-card';
import BackupCard from './backup-card';
import BoostCard from './boost-card';
import CrmCard from './crm-card';
import ExtrasCard from './extras-card';
import ScanCard from './scan-card';
import SearchCard from './search-card';
import SocialCard from './social-card';
import VideopressCard from './videopress-card';

/**
 * Product cards section component.
 *
 * @returns {object} ProductCardsSection React component.
 */
const ProductCardsSection = () => {
	return (
		<Container fluid horizontalSpacing={ 0 } horizontalGap={ 3 }>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<BackupCard admin={ true } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<ScanCard admin={ true } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<AntiSpamCard admin={ true } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<BoostCard admin={ true } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<SearchCard admin={ true } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<VideopressCard admin={ true } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<CrmCard admin={ true } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<SocialCard admin={ true } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 3 }>
				<ExtrasCard admin={ true } />
			</Col>
		</Container>
	);
};

export default ProductCardsSection;
