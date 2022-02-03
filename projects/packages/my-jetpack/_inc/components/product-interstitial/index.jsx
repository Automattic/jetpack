/**
 * External dependencies
 */
import React from 'react';
import { Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { ProductDetail } from '../product-detail-card';
import styles from './style.module.scss';

/**
 * Product Interstitial component.
 *
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @returns {object}                ProductInterstitial react component.
 */
export default function ProductInterstitial( { slug } ) {
	return (
		<Container className={ styles.container } fluid horizontalSpacing={ 0 } horizontalGap={ 3 }>
			<Col sm={ 4 } md={ 4 } lg={ 6 }>
				<ProductDetail slug={ slug } />
			</Col>
		</Container>
	);
}

/**
 * BackupInterstitial component
 *
 * @returns {object} BackupInterstitial react component.
 */
export function BackupInterstitial() {
	return <ProductInterstitial slug="backup" />;
}

/**
 * BoostInterstitial component
 *
 * @returns {object} BoostInterstitial react component.
 */
export function BoostInterstitial() {
	return <ProductInterstitial slug="boost" />;
}
