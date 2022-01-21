/**
 * External dependencies
 */
import React from 'react';
import { Container, Row, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../product-card';
import BackupCard from './backup-card';
import ScanCard from './scan-card';
import AntiSpamCard from './anti-spam-card';
import BoostCard from './boost-card';
import SearchCard from './search-card';
import VideopressCard from './videopress-card';

/**
 * Product cards section component.
 *
 * @returns {object} ProductCardsSection React component.
 */
export default function ProductCardsSection() {
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
					<ProductCard
						name="CRM"
						description="Connect with your people"
						status={ PRODUCT_STATUSES.ERROR }
					/>
				</Col>
				<Col sm={ 3 }>
					<ProductCard
						name="Extras"
						description="Basic tools for a successful site"
						status={ PRODUCT_STATUSES.ERROR }
					/>
				</Col>
			</Row>
		</Container>
	);
}
