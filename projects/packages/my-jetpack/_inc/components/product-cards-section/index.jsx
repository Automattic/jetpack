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
					<ProductCard
						name="Anti-spam"
						description="Stop comment and form spam"
						status={ PRODUCT_STATUSES.ERROR }
					/>
				</Col>
				<Col sm={ 3 }>
					<ProductCard
						name="Boost"
						description="Instant speed and SEO"
						status={ PRODUCT_STATUSES.ERROR }
					/>
				</Col>
				<Col sm={ 3 }>
					<ProductCard
						name="Search"
						description="Help them find what they need"
						status={ PRODUCT_STATUSES.ERROR }
					/>
				</Col>
				<Col sm={ 3 }>
					<ProductCard
						name="VideoPress"
						description="High-quality, ad-free video"
						status={ PRODUCT_STATUSES.ERROR }
					/>
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
