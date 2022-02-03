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
 * @param {object} props.children - Product additional content
 * @returns {object}                ProductInterstitial react component.
 */
export default function ProductInterstitial( { slug, children = null } ) {
	return (
		<Container className={ styles.container } fluid horizontalSpacing={ 0 } horizontalGap={ 0 }>
			<Col sm={ 4 } md={ 4 } lg={ 6 }>
				<ProductDetail slug={ slug } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 6 }>
				{ children }
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
	return (
		<ProductInterstitial slug="backup">
			<h2>@todo Popular upgrade here</h2>
		</ProductInterstitial>
	);
}

/**
 * BoostInterstitial component
 *
 * @returns {object} BoostInterstitial react component.
 */
export function BoostInterstitial() {
	return <ProductInterstitial slug="boost" />;
}
