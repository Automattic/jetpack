/**
 * External dependencies
 */
import React from 'react';
import { Container, Row, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import BackupCard from './backup-card';
import ScanCard from './scan-card';
import AntiSpamCard from './anti-spam-card';
import BoostCard from './boost-card';
import SearchCard from './search-card';
import VideopressCard from './videopress-card';
import CrmCard from './crm-card';
import ExtrasCard from './extras-card';

/**
 * Product cards section component.
 *
 * @returns {object} ProductCardsSection React component.
 */
const ProductCardsSection = () => {
	return (
		<Container>
			<Row>
				<Col sm={ 3 }>
					<BackupCard admin={ true } />
				</Col>
				<Col sm={ 3 }>
					<ScanCard admin={ true } />
				</Col>
				<Col sm={ 3 }>
					<AntiSpamCard admin={ true } />
				</Col>
				<Col sm={ 3 }>
					<BoostCard admin={ true } />
				</Col>
				<Col sm={ 3 }>
					<SearchCard admin={ true } />
				</Col>
				<Col sm={ 3 }>
					<VideopressCard admin={ true } />
				</Col>
				<Col sm={ 3 }>
					<CrmCard admin={ true } />
				</Col>
				<Col sm={ 3 }>
					<ExtrasCard admin={ true } />
				</Col>
			</Row>
		</Container>
	);
};

export default ProductCardsSection;
