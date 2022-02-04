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
import boostImage from './boost.png';
import { useRecordEventOnView, useRecordEventOnEvent } from '../../hooks/use-analytics';

/**
 * Product Interstitial component.
 *
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @param {object} props.children - Product additional content
 * @returns {object}                ProductInterstitial react component.
 */
export default function ProductInterstitial( { slug, children = null } ) {
	useRecordEventOnView( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );

	const trackProductClick = useRecordEventOnEvent(
		'jetpack_myjetpack_product_interstitial_add_link_click',
		{ product: slug }
	);

	return (
		<div className={ styles.wrapper }>
			<Container className={ styles.container } horizontalSpacing={ 0 } horizontalGap={ 0 }>
				<Col sm={ 4 } md={ 4 } lg={ 5 }>
					<ProductDetail slug={ slug } trackButtonClick={ trackProductClick } />
				</Col>
				<Col sm={ 4 } md={ 4 } lg={ 7 } className={ styles.imageContainer }>
					{ children }
				</Col>
			</Container>
		</div>
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
	return (
		<ProductInterstitial slug="boost">
			<img src={ boostImage } alt="Boost" />
		</ProductInterstitial>
	);
}
